import type { Pelicula } from "../core/domain/pelicula.js";

export interface ICarteleraRepository {
  upsertPeliculas(peliculas: Pelicula[]): Promise<void>;
  getPeliculas(): Promise<Pelicula[]>;
  upsertPelicula(pelicula: Pelicula): Promise<void>;
  getPeliculaByName(nombre: string): Promise<Pelicula | null>;
  buscarPorTMDBId(tmdbId: number): Promise<Pelicula | null>;
}
