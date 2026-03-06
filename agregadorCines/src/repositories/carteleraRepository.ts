import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { Alerta } from "../core/domain/alerta.js";
import type { ICarteleraRepository } from "./ICarteleraRepository.js";
import prisma from "../lib/db.js";

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
      ...(pelicula.fechaFunciones != null && {
        fechaFunciones: pelicula.fechaFunciones,
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
    // Secuencial en lugar de Promise.all para evitar la race condition donde
    // dos películas con el mismo título/tmdbId se insertan concurrentemente
    // y una falla con P2002.
    for (const pelicula of listaPeliculas) {
      await this.upsertPelicula(pelicula);
    }
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
