import type { Localidad } from "./pelicula";

/** popularidad: TMDB (por defecto en la API); proxima: próxima función primero */
export type OrdenPeliculas = "proxima" | "popularidad";

export enum Categoria {
  ESTRENOS = "estrenos",
  REESTRENOS = "reestrenos",
}

/** Params para GET /peliculas */
export interface GetPeliculasParams {
  orden?: OrdenPeliculas;
  page?: number;
  limit?: number;
  /** Uno o varios cines; se envía como "1,3" */
  cineIds?: number[];
  localidad?: Localidad;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
