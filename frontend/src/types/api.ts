import type { Localidad } from "./pelicula";

/** proxima: próxima función primero (por defecto en la API); popularidad: TMDB */
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
  cineId?: number;
  localidad?: Localidad;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
