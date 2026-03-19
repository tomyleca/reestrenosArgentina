export type FiltroPeriodo = "hoy" | "semana";

export enum Categoria {
  ESTRENOS = "estrenos",
  REESTRENOS = "reestrenos",
}

/** Params para GET /peliculas */
export interface GetPeliculasParams {
  periodo?: FiltroPeriodo;
  /** Por defecto true en el backend. Pasar false para incluir inactivas. */
  activas?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
