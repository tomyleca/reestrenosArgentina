import type { Localidad } from "./pelicula";

/** popularidad: TMDB (por defecto en la API); proxima: próxima función primero */
export type OrdenPeliculas = "proxima" | "popularidad";

// Orden inicial de la grilla. La carga del servidor (page.tsx) lo manda explícito:
// así no depende del default de la API, que puede estar en otra versión o cacheada.
export const ORDEN_POR_DEFECTO: OrdenPeliculas = "popularidad";

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
