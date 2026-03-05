import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { ICarteleraRepository } from "./ICarteleraRepository.js";
import prisma from "../lib/db.js";
import { Prisma } from "@prisma/client";

export class PrismaCarteleraRepository implements ICarteleraRepository {
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

    await prisma.pelicula.upsert({
      where,
      update: { ...camposComunes, ...relaciones },
      create: {
        titulo: pelicula.titulo,
        ...(pelicula.tmdbId != null && { tmdbId: pelicula.tmdbId }),
        ...camposComunes,
        ...relaciones,
      },
    });
  }

  async upsertPeliculas(listaPeliculas: Pelicula[]): Promise<void> {
    await Promise.all(listaPeliculas.map((p) => this.upsertPelicula(p)));
  }

  async getPeliculas(): Promise<Pelicula[]> {
    return await prisma.pelicula.findMany({
      include: {
        generos: true,
        cines: true,
      },
    });
  }

  async getPeliculaByName(nombre: string): Promise<Pelicula | null> {
    return await prisma.pelicula.findFirst({
      where: { titulo: nombre },
      include: { generos: true, cines: true },
    });
  }

  async buscarPorTMDBId(tmdbId: number): Promise<Pelicula | null> {
    return await prisma.pelicula.findFirst({
      where: { tmdbId },
      include: { generos: true, cines: true },
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
