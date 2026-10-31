import type { Localidad } from "./pelicula";

export type FiltroPeriodo = "hoy" | "semana" | "mes";

export enum Categoria {
  ESTRENOS = "estrenos",
  REESTRENOS = "reestrenos",
}

/** Params para GET /peliculas */
export interface GetPeliculasParams {
  periodo?: FiltroPeriodo;
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
