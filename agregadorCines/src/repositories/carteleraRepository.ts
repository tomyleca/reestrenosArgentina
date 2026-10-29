import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { Alerta } from "../core/domain/alerta.js";
import type { ICarteleraRepository } from "./ICarteleraRepository.js";
import type { Categoria } from "../core/domain/categoria.js";
import type { QueryOpciones, PaginatedResult } from "../api/types.js";
import prisma from "../lib/db.js";
import { calendarioArgentina, fechaArgentina } from "../utils/fechasArgentina.js";

const DEFAULT_LIMIT = 25;

export class PrismaCarteleraRepository implements ICarteleraRepository {
  async agregarAlerta(alerta: Alerta): Promise<void> {
    await prisma.alerta.create({
      data: {
        id: alerta.id,
        mensaje: alerta.mensaje,
        fecha: alerta.fecha,
      },
    });
  }

  async upsertPelicula(pelicula: Pelicula): Promise<void> {
    const generos = {
      connectOrCreate: pelicula.generos.map((g) => ({
        where: { tmdbId: g.tmdbId },
        create: { tmdbId: g.tmdbId, nombre: g.nombre },
      })),
    };
    const cinesIds = pelicula.cines.map((c) => ({ id: c.id }));

    const camposComunes = {
      descripcion: pelicula.descripcion,
      duracionMinutos: pelicula.duracionMinutos,
      categoria: pelicula.categoria,
      activa: pelicula.activa,
      ...(pelicula.poster_path != null && {
        poster_path: pelicula.poster_path,
      }),
      ...(pelicula.popularidad != null && {
        popularidad: pelicula.popularidad,
      }),
      ...(pelicula.fechaLanzamiento != null && {
        fechaLanzamiento: pelicula.fechaLanzamiento,
      }),
    };

    // La identidad de una película es su tmdbId: el título no sirve porque
    // remakes y homónimas lo comparten (ej. Nosferatu 1922 y 2024).
    if (pelicula.tmdbId == null) {
      throw new Error(
        `No se puede guardar "${pelicula.titulo}" sin tmdbId.`,
      );
    }

    const result = await prisma.pelicula.upsert({
      where: { tmdbId: pelicula.tmdbId },
      update: {
        titulo: pelicula.titulo,
        ...camposComunes,
        generos,
        // `set` reemplaza los cines: la película queda vinculada solo a los
        // cines donde se encontró en esta corrida, no a los de corridas viejas.
        cines: { set: cinesIds },
      },
      create: {
        titulo: pelicula.titulo,
        tmdbId: pelicula.tmdbId,
        ...camposComunes,
        generos,
        cines: { connect: cinesIds },
      },
      select: { id: true },
    });

    // Agrega las funciones con skipDuplicates para evitar duplicados
    // (garantizado por el unique constraint [peliculaId, fecha] en el schema)
    if (pelicula.funciones && pelicula.funciones.length > 0) {
      await prisma.funcion.createMany({
        data: pelicula.funciones.map((f) => ({
          fecha: f.fecha,
          peliculaId: result.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  async upsertPeliculas(listaPeliculas: Pelicula[]): Promise<void> {
    // Secuencial en lugar de Promise.all para evitar la race condition donde
    // dos películas con el mismo título/tmdbId se insertan concurrentemente
    // y una falla con P2002.
    for (const pelicula of listaPeliculas) {
      await this.upsertPelicula(pelicula);
    }
  }


  async getPeliculaById(id: number): Promise<Pelicula | null> {
    return await prisma.pelicula.findUnique({
      where: { id },
      include: { generos: true, cines: true, funciones: true },
    });
  }


  async getPeliculasByCategoriaPaginadas(
    categoria: Categoria,
    opciones?: QueryOpciones,
  ): Promise<PaginatedResult<Pelicula>> {
    const soloActivas = opciones?.soloActivas ?? true;
    const limit = opciones?.limit ?? DEFAULT_LIMIT;
    const page = opciones?.page ?? 1;
    const skip = (page - 1) * limit;

    const funcionesFiltro = opciones?.filtroPeriodo
      ? buildFuncionesFiltro(opciones.filtroPeriodo)
      : undefined;

    const cineFiltro = opciones?.cineId
      ? { some: { id: opciones.cineId } }
      : opciones?.localidad
        ? { some: { localidad: opciones.localidad } }
        : undefined;

    const where = {
      categoria,
      activa: soloActivas,
      ...(funcionesFiltro && { funciones: funcionesFiltro }),
      ...(cineFiltro && { cines: cineFiltro }),
    };

    const [total, data] = await prisma.$transaction([
      prisma.pelicula.count({ where }),
      prisma.pelicula.findMany({
        where,
        include: { generos: true, cines: true, funciones: true },
        orderBy: { popularidad: "desc" }, //siempre devuelve las peliculas ordenadas por popularidad
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + data.length < total,
    };
  }

  async getPeliculaByName(nombre: string): Promise<Pelicula | null> {
    return await prisma.pelicula.findFirst({
      where: { titulo: nombre },
      include: { generos: true, cines: true, funciones: true },
    });
  }

  async buscarPorTMDBId(tmdbId: number): Promise<Pelicula | null> {
    return await prisma.pelicula.findFirst({
      where: { tmdbId },
      include: { generos: true, cines: true, funciones: true },
    });
  }

  async getCineByNombre(nombre: string): Promise<Cine | null> {
    return await prisma.cine.findFirst({
      where: { nombre },
    });
  }

  async getCines(): Promise<Cine[]> {
    return await prisma.cine.findMany({
      orderBy: { nombre: "asc" },
    });
  }

  async upsertCine(cine: Omit<Cine, "id">): Promise<Cine> {
    return await prisma.cine.upsert({
      where: { nombre: cine.nombre },
      update: {
        localidad: cine.localidad,
        url: cine.url,
        api_url: cine.api_url ?? null,
      },
      create: {
        nombre: cine.nombre,
        localidad: cine.localidad,
        url: cine.url,
        api_url: cine.api_url ?? null,
      },
    });
  }

  async limpiarCartelera(): Promise<void> {
    await prisma.pelicula.updateMany({ data: { activa: false } });
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// "Hoy" es el día de Argentina, no el del servidor (Vercel corre en UTC).
const DIAS_POR_PERIODO = {
  hoy: 1,
  semana: 7, // desde hoy hasta 6 días después
  mes: 30, // desde hoy hasta 29 días después
} as const;

export function buildFuncionesFiltro(
  periodo: "hoy" | "semana" | "mes",
  ahora: Date = new Date(),
) {
  const { anio, mes, dia } = calendarioArgentina(ahora);
  const desde = fechaArgentina(anio, mes, dia);
  // Fin exclusivo: 00:00 del día siguiente al último del período
  const hasta = fechaArgentina(anio, mes, dia + DIAS_POR_PERIODO[periodo]);

  // El filtro `some` genera un subquery SQL en lugar de filtrado en memoria
  return { some: { fecha: { gte: desde, lt: hasta } } };
}
