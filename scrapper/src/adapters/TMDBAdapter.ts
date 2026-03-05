import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { IDatosPeliculaGetter } from "../core/interfaces/IDatosPeliculaGetter.js";
import { TMDB } from "./tmdb.js";
import { agregarCine, calcularCategoria } from "../core/domain/pelicula.js";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";

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
    const resultados = await Promise.allSettled(
      peliculasInput.map((p) => this.getPeliculaFromScrapeado(p)),
    );

    return resultados.flatMap((resultado, i) => {
      if (resultado.status === "fulfilled") {
        return [resultado.value];
      }
      console.warn(
        `⚠️  No se pudo obtener datos de TMDB para "${peliculasInput[i]?.titulo}": ${resultado.reason instanceof Error ? resultado.reason.message : resultado.reason}`,
      );
      return [];
    });
  }

  async getPeliculaFromScrapeado(
    peliculaInput: PeliculaInput,
  ): Promise<Pelicula> {
    const idTMDBPelicula = await this.tmdb.buscarPeliculaId(
      peliculaInput.titulo,
    );
    if (!idTMDBPelicula) {
      throw new Error("No se encontro la pelicula en TMDB");
    }

    const peliculaExistente =
      await this.carteleraRepository.buscarPorTMDBId(idTMDBPelicula);
    if (peliculaExistente) {
      agregarCine(peliculaExistente, peliculaInput.cine);
      return peliculaExistente;
    }

    const detallePelicula =
      await this.tmdb.buscarDetallesDePelicula(idTMDBPelicula);
    const pelicula: Pelicula = {
      id: detallePelicula.id,
      titulo: detallePelicula.title,
      descripcion: detallePelicula.overview,
      poster_path: detallePelicula.poster_path,
      duracionMinutos: detallePelicula.runtime,
      popularidad: detallePelicula.popularity,
      fechaLanzamiento: detallePelicula.release_date,
      generos: detallePelicula.genres.map((g) => {
        return {
          tmdbId: g.id,
          nombre: g.name,
        };
      }),
      categoria: calcularCategoria(detallePelicula.release_date),
      activa: true,
      tmdbId: detallePelicula.id,
      cines: [peliculaInput.cine],
    };

    return Promise.resolve(pelicula);
  }
}
