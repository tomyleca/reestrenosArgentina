import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";

export interface ICarteleraRepository {
  upsertPeliculas(peliculas: Pelicula[]): Promise<void>;
  getPeliculas(): Promise<Pelicula[]>;
  upsertPelicula(pelicula: Pelicula): Promise<void>;
  getPeliculaByName(nombre: string): Promise<Pelicula | null>;
  buscarPorTMDBId(tmdbId: number): Promise<Pelicula | null>;
  getCineByNombre(nombre: string): Promise<Cine | null>;
  upsertCine(cine: Omit<Cine, "id">): Promise<Cine>;
}
