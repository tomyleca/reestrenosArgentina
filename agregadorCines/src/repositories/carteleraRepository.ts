import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { Alerta } from "../core/domain/alerta.js";
import type { ICarteleraRepository } from "./ICarteleraRepository.js";
import type { Categoria } from "../core/domain/categoria.js";
import type { QueryOpciones, PaginatedResult } from "../api/types.js";
import prisma from "../lib/db.js";

const DEFAULT_LIMIT = 10;

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
    const relaciones = {
      generos: {
        connectOrCreate: pelicula.generos.map((g) => ({
          where: { tmdbId: g.tmdbId },
          create: { tmdbId: g.tmdbId, nombre: g.nombre },
        })),
      },
      cines: { connect: pelicula.cines.map((c) => ({ id: c.id })) },
    };

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

    const where =
      pelicula.tmdbId != null
        ? { tmdbId: pelicula.tmdbId }
        : { titulo: pelicula.titulo };

    const result = await prisma.pelicula.upsert({
      where,
      update: { ...camposComunes, ...relaciones },
      create: {
        titulo: pelicula.titulo,
        ...(pelicula.tmdbId != null && { tmdbId: pelicula.tmdbId }),
        ...camposComunes,
        ...relaciones,
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

  async getPeliculas(opciones?: QueryOpciones): Promise<Pelicula[]> {
    const soloActivas = opciones?.soloActivas ?? true;
    return await prisma.pelicula.findMany({
      where: { activa: soloActivas },
      include: { generos: true, cines: true, funciones: true },
      ...(opciones?.ordenarPorPopularidad && {
        orderBy: { popularidad: "desc" },
      }),
    });
  }

  async getPeliculaById(id: number): Promise<Pelicula | null> {
    return await prisma.pelicula.findUnique({
      where: { id },
      include: { generos: true, cines: true, funciones: true },
    });
  }

  async getPeliculasByCategoria(
    categoria: Categoria,
    opciones?: QueryOpciones,
  ): Promise<Pelicula[]> {
    const soloActivas = opciones?.soloActivas ?? true;

    const funcionesFiltro = opciones?.filtroPeriodo
      ? buildFuncionesFiltro(opciones.filtroPeriodo)
      : undefined;

    return await prisma.pelicula.findMany({
      where: {
        categoria,
        activa: soloActivas,
        ...(funcionesFiltro && { funciones: funcionesFiltro }),
      },
      include: { generos: true, cines: true, funciones: true },
      ...(opciones?.ordenarPorPopularidad && {
        orderBy: { popularidad: "desc" },
      }),
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

    const where = {
      categoria,
      activa: soloActivas,
      ...(funcionesFiltro && { funciones: funcionesFiltro }),
    };

    const orderBy = opciones?.ordenarPorPopularidad
      ? { popularidad: "desc" as const }
      : undefined;

    const [total, data] = await prisma.$transaction([
      prisma.pelicula.count({ where }),
      prisma.pelicula.findMany({
        where,
        include: { generos: true, cines: true, funciones: true },
        ...(orderBy && { orderBy }),
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
}

function buildFuncionesFiltro(periodo: "hoy" | "semana") {
  const ahora = new Date();

  const desde = new Date(ahora);
  desde.setHours(0, 0, 0, 0);

  const hasta = new Date(ahora);

  if (periodo === "hoy") {
    hasta.setHours(23, 59, 59, 999);
  } else {
    // "semana": desde hoy hasta 6 días después (7 días en total)
    hasta.setDate(hasta.getDate() + 6);
    hasta.setHours(23, 59, 59, 999);
  }

  // El filtro `some` genera un subquery SQL en lugar de filtrado en memoria
  return { some: { fecha: { gte: desde, lte: hasta } } };
}
