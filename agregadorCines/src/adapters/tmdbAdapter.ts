import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { IDatosPeliculaGetter } from "../core/interfaces/IDatosPeliculaGetter.js";
import { TMDB } from "./tmdb.js";
import {
  agregarCine,
  calcularCategoria,
  agregarFechaFuncion,
} from "../core/domain/pelicula.js";
import { Categoria } from "../core/domain/categoria.js";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";
import { randomUUID } from "node:crypto";

import { tmdbLogger } from "./tmdbLogger.js";

export interface ITMDBAdapter extends IDatosPeliculaGetter {
  tmdb: TMDB;
  carteleraRepository: ICarteleraRepository;

  getPeliculasFromScrapeado(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]>;
  getPeliculaFromScrapeado(peliculaInput: PeliculaInput): Promise<Pelicula>;
}

export class TMDBAdapter implements ITMDBAdapter {
  tmdb: TMDB;
  carteleraRepository: ICarteleraRepository;

  constructor(tmdb: TMDB, carteleraRepository: ICarteleraRepository) {
    this.tmdb = tmdb;
    this.carteleraRepository = carteleraRepository;
  }

  async getPeliculasFromScrapeado(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]> {
    tmdbLogger.resetContadores();
    const peliculas: Pelicula[] = [];

    for (const peliculaInput of peliculasInput) {
      tmdbLogger.incrementarProcesadas();
      try {
        const pelicula = await this.getPeliculaFromScrapeado(peliculaInput);
        peliculas.push(pelicula);
      } catch (reason) {
        await this.carteleraRepository.agregarAlerta({
          id: randomUUID(),
          mensaje: `No se pudo obtener datos de TMDB para "${peliculaInput.titulo}": ${reason instanceof Error ? reason.message : reason}`,
          fecha: new Date(),
        });
      }
    }

    tmdbLogger.resumenIA();
    return peliculas;
  }

  async getPeliculaFromScrapeado(
    peliculaInput: PeliculaInput,
  ): Promise<Pelicula> {
    const idTMDBPelicula = await this.tmdb.buscarPeliculaId(peliculaInput);
    if (!idTMDBPelicula) {
      throw new Error("No se encontro la pelicula en TMDB");
    }

    const peliculaExistente =
      await this.carteleraRepository.buscarPorTMDBId(idTMDBPelicula);
    if (peliculaExistente) {
      peliculaExistente.activa = true;
      agregarCine(peliculaExistente, peliculaInput.cine);
      agregarFechaFuncion(peliculaExistente, peliculaInput.fecha);
      return peliculaExistente;
    }

    const detallePelicula =
      await this.tmdb.buscarDetallesDePelicula(idTMDBPelicula);

	//new Date devuelve NaN si la fecha es invalida
    const releaseDateObj = detallePelicula.release_date ? new Date(detallePelicula.release_date) : null;
    const isValidDate = releaseDateObj && !isNaN(releaseDateObj.getTime());

    const pelicula: Pelicula = {
      id: detallePelicula.id,
      titulo: detallePelicula.title,
      descripcion: detallePelicula.overview,
      poster_path: detallePelicula.poster_path,
      duracionMinutos: detallePelicula.runtime,
      popularidad: detallePelicula.popularity,
      fechaLanzamiento: isValidDate ? releaseDateObj : null,
      generos: detallePelicula.genres.map((g) => {
        return {
          tmdbId: g.id,
          nombre: g.name,
        };
      }),
      categoria: isValidDate ? calcularCategoria(releaseDateObj) : Categoria.ESTRENOS,
      activa: true,
      tmdbId: detallePelicula.id,
      cines: [peliculaInput.cine],
      funciones: [],
    };

    if (peliculaInput.fecha) {
      agregarFechaFuncion(pelicula, peliculaInput.fecha);
    }

    return Promise.resolve(pelicula);
  }
}
