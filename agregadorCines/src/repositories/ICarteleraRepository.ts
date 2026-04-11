import type { Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { Alerta } from "../core/domain/alerta.js";
import type { Categoria } from "../core/domain/categoria.js";
import type { QueryOpciones, PaginatedResult } from "../api/types.js";

export interface ICarteleraRepository {
  upsertPeliculas(peliculas: Pelicula[]): Promise<void>;
  getPeliculaById(id: number): Promise<Pelicula | null>;
  getPeliculasByCategoriaPaginadas(
    categoria: Categoria,
    opciones?: QueryOpciones,
  ): Promise<PaginatedResult<Pelicula>>;
  upsertPelicula(pelicula: Pelicula): Promise<void>;
  getPeliculaByName(nombre: string): Promise<Pelicula | null>;
  buscarPorTMDBId(tmdbId: number): Promise<Pelicula | null>;
  getCineByNombre(nombre: string): Promise<Cine | null>;
  getCines(): Promise<Cine[]>;
  upsertCine(cine: Omit<Cine, "id">): Promise<Cine>;
  agregarAlerta(alerta: Alerta): Promise<void>;
}
