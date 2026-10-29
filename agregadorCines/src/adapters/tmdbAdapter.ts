import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { IDatosPeliculaGetter } from "../core/interfaces/IDatosPeliculaGetter.js";
import { TMDB } from "./tmdb.js";
import type { TMDBPeliculaDetalleDTO } from "../core/dtos/tmdbPeliculaDetalleDTO.js";
import {
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
  // Cachés que viven durante una corrida de refresco
  private cacheBusqueda = new Map<string, number | null>();
  private cacheDetalle = new Map<number, TMDBPeliculaDetalleDTO>();

  constructor(tmdb: TMDB, carteleraRepository: ICarteleraRepository) {
    this.tmdb = tmdb;
    this.carteleraRepository = carteleraRepository;
  }

  async getPeliculasFromScrapeado(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]> {
    tmdbLogger.resetContadores();
    this.cacheBusqueda.clear();
    this.cacheDetalle.clear();
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
    const idTMDBPelicula = await this.buscarIdCacheado(peliculaInput);
    if (!idTMDBPelicula) {
      throw new Error("No se encontro la pelicula en TMDB");
    }

    const peliculaExistente =
      await this.carteleraRepository.buscarPorTMDBId(idTMDBPelicula);
    if (peliculaExistente) {
      // Arranca solo con los datos de esta corrida: el repositorio reemplaza
      // los cines con `set`, así que no hay que arrastrar los de la DB.
      peliculaExistente.activa = true;
      peliculaExistente.cines = [peliculaInput.cine];
      peliculaExistente.funciones = [];
      // La categoría depende de la fecha actual (más de un año desde el
      // lanzamiento = reestreno), así que se recalcula en cada corrida.
      if (peliculaExistente.fechaLanzamiento) {
        peliculaExistente.categoria = calcularCategoria(
          peliculaExistente.fechaLanzamiento,
        );
      }
      agregarFechaFuncion(
        peliculaExistente,
        peliculaInput.fecha,
        peliculaInput.cine.id,
      );
      return peliculaExistente;
    }

    const detallePelicula = await this.buscarDetalleCacheado(idTMDBPelicula);

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
      agregarFechaFuncion(pelicula, peliculaInput.fecha, peliculaInput.cine.id);
    }

    return Promise.resolve(pelicula);
  }

  // Los providers devuelven una entrada por función, así que la misma película
  // del mismo cine se busca varias veces. Cacheamos también el null para no
  // repetir la búsqueda (ni la posible llamada a Gemini) cuando no se encontró.
  // La clave incluye el cine porque dos cines pueden pasar películas homónimas.
  private async buscarIdCacheado(
    peliculaInput: PeliculaInput,
  ): Promise<number | null> {
    const clave = `${peliculaInput.cine.id}|${peliculaInput.titulo.toLowerCase().trim()}`;
    if (this.cacheBusqueda.has(clave)) {
      return this.cacheBusqueda.get(clave) ?? null;
    }
    const id = await this.tmdb.buscarPeliculaId(peliculaInput);
    this.cacheBusqueda.set(clave, id);
    return id;
  }

  private async buscarDetalleCacheado(
    tmdbId: number,
  ): Promise<TMDBPeliculaDetalleDTO> {
    const cacheado = this.cacheDetalle.get(tmdbId);
    if (cacheado) return cacheado;
    const detalle = await this.tmdb.buscarDetallesDePelicula(tmdbId);
    this.cacheDetalle.set(tmdbId, detalle);
    return detalle;
  }
}
