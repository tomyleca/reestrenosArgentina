import type { Prisma } from "@prisma/client";
import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { Alerta } from "../core/domain/alerta.js";
import type {
  ICarteleraRepository,
  PeliculaEnCine,
} from "./ICarteleraRepository.js";
import type { Categoria } from "../core/domain/categoria.js";
import type { QueryOpciones, PaginatedResult } from "../api/types.js";
import prisma from "../lib/db.js";
import {
  calendarioArgentina,
  fechaArgentina,
  inicioDelDiaArgentina,
} from "../utils/fechasArgentina.js";

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

  // Guarda solo los datos de la película (TMDB). Los cines y las funciones los
  // escribe cada cine con reemplazarCarteleraDeCine.
  async upsertPelicula(pelicula: Pelicula): Promise<void> {
    const generos = {
      connectOrCreate: pelicula.generos.map((g) => ({
        where: { tmdbId: g.tmdbId },
        create: { tmdbId: g.tmdbId, nombre: g.nombre },
      })),
    };

    const camposComunes = {
      descripcion: pelicula.descripcion,
      duracionMinutos: pelicula.duracionMinutos,
      categoria: pelicula.categoria,
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

    await prisma.pelicula.upsert({
      where: { tmdbId: pelicula.tmdbId },
      update: {
        titulo: pelicula.titulo,
        ...camposComunes,
        generos,
      },
      create: {
        titulo: pelicula.titulo,
        tmdbId: pelicula.tmdbId,
        ...camposComunes,
        generos,
      },
    });
  }

  async upsertPeliculas(listaPeliculas: Pelicula[]): Promise<void> {
    // Secuencial en lugar de Promise.all para evitar la race condition donde
    // dos películas con el mismo título/tmdbId se insertan concurrentemente
    // y una falla con P2002.
    for (const pelicula of listaPeliculas) {
      await this.upsertPelicula(pelicula);
    }
  }

  // Cada cine es dueño de su cartelera: se reemplazan sus películas y sus
  // funciones de una vez. Un cine cuyo scraping falló no llama a este método,
  // así que conserva la cartelera de la corrida anterior.
  async reemplazarCarteleraDeCine(
    cineId: number,
    peliculas: PeliculaEnCine[],
  ): Promise<void> {
    const guardadas = await prisma.pelicula.findMany({
      where: { tmdbId: { in: peliculas.map((p) => p.tmdbId) } },
      select: { id: true, tmdbId: true },
    });
    const idPorTmdbId = new Map(guardadas.map((p) => [p.tmdbId, p.id]));

    const funciones = peliculas.flatMap((p) => {
      const peliculaId = idPorTmdbId.get(p.tmdbId);
      if (peliculaId === undefined) return [];
      return p.fechas.map((fecha) => ({ fecha, peliculaId, cineId }));
    });

    await prisma.$transaction([
      prisma.funcion.deleteMany({ where: { cineId } }),
      prisma.funcion.createMany({ data: funciones, skipDuplicates: true }),
      prisma.cine.update({
        where: { id: cineId },
        data: {
          peliculas: { set: guardadas.map((p) => ({ id: p.id })) },
          ultimaActualizacion: new Date(),
        },
      }),
    ]);
  }

  async getPeliculaById(id: number): Promise<Pelicula | null> {
    const pelicula = await prisma.pelicula.findUnique({
      where: { id },
      include: includeCartelera(inicioDelDiaArgentina()),
    });
    return pelicula && soloCinesDisponibles(pelicula);
  }

  async getPeliculasByCategoriaPaginadas(
    categoria: Categoria,
    opciones?: QueryOpciones,
  ): Promise<PaginatedResult<Pelicula>> {
    const limit = opciones?.limit ?? DEFAULT_LIMIT;
    const page = opciones?.page ?? 1;
    const skip = (page - 1) * limit;
    const hoy = inicioDelDiaArgentina();

    const cine: Prisma.CineWhereInput = opciones?.cineId
      ? { id: opciones.cineId }
      : opciones?.localidad
        ? { localidad: opciones.localidad }
        : {};

    // Una película está en cartelera en un cine si:
    // - el cine tiene funciones y hay alguna de hoy en adelante, o
    // - el cine no tiene funciones y apareció en su último scraping exitoso.
    // El filtro de período solo aplica a cines con funciones.
    const disponible: Prisma.PeliculaWhereInput = opciones?.filtroPeriodo
      ? {
          funciones: {
            some: { ...buildFuncionesFiltro(opciones.filtroPeriodo).some, cine },
          },
        }
      : {
          OR: [
            {
              funciones: {
                some: {
                  fecha: { gte: hoy },
                  cine: { ...cine, tieneFunciones: true },
                },
              },
            },
            { cines: { some: { ...cine, tieneFunciones: false } } },
          ],
        };

    const where: Prisma.PeliculaWhereInput = { categoria, ...disponible };

    const [total, data] = await prisma.$transaction([
      prisma.pelicula.count({ where }),
      prisma.pelicula.findMany({
        where,
        include: includeCartelera(hoy),
        orderBy: { popularidad: "desc" }, //siempre devuelve las peliculas ordenadas por popularidad
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data.map(soloCinesDisponibles),
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
        tieneFunciones: cine.tieneFunciones,
      },
      create: {
        nombre: cine.nombre,
        localidad: cine.localidad,
        url: cine.url,
        api_url: cine.api_url ?? null,
        tieneFunciones: cine.tieneFunciones,
      },
    });
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// La API devuelve solo las funciones de hoy en adelante, ordenadas por fecha.
function includeCartelera(desde: Date) {
  return {
    generos: true,
    cines: true,
    funciones: {
      where: { fecha: { gte: desde } },
      orderBy: { fecha: "asc" },
    },
  } satisfies Prisma.PeliculaInclude;
}

// Un cine con funciones solo cuenta si a la película le quedan funciones ahí;
// un cine sin funciones cuenta si la vio en su último scraping exitoso.
function soloCinesDisponibles<
  T extends { cines: Cine[]; funciones: { cineId: number }[] },
>(pelicula: T): T {
  return {
    ...pelicula,
    cines: pelicula.cines.filter(
      (c) =>
        !c.tieneFunciones || pelicula.funciones.some((f) => f.cineId === c.id),
    ),
  };
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
