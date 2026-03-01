import type { Pelicula } from "../core/domain/pelicula.js";
import prisma from "../lib/db.js";
import { Prisma } from "@prisma/client";

export interface ICarteleraRepository {
  upsertPeliculas(pelicula: Prisma.PeliculaCreateInput[]): Promise<void>;
  upsertPelicula(pelicula: Prisma.PeliculaCreateInput): Promise<void>;
  getPeliculas(): Promise<Pelicula[]>;
}

export class PrismaCarteleraRepository implements ICarteleraRepository {
  async upsertPelicula(pelicula: Prisma.PeliculaCreateInput): Promise<void> {
    await prisma.pelicula.upsert({
      where: {
        titulo: pelicula.titulo, // Si no tiene ID, usamos un valor que no existe para forzar la creación
      },
      update: pelicula, // Ahora sí coincide el tipo perfectamente
      create: pelicula,
    });
  }

  async upsertPeliculas(
    listaPeliculas: Prisma.PeliculaCreateInput[],
  ): Promise<void> {
    const promesas = listaPeliculas.map((p) => this.upsertPelicula(p));

    // Esperamos a que todas se resuelvan
    await Promise.all(promesas);
  }

  async getPeliculas(): Promise<Pelicula[]> {
    return await prisma.pelicula.findMany({
      include: {
        generos: true,
        cines: true,
      },
    });
  }
}
