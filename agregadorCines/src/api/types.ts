import type { Localidad } from "../core/domain/localidad.js";

export type FiltroPeriodo = "hoy" | "semana" | "mes" | null;

export interface QueryReestrenos {
  periodo?: FiltroPeriodo;
}

// proxima: próxima función primero (las películas sin funciones al final); popularidad: TMDB
export type OrdenPeliculas = "proxima" | "popularidad";

export interface PaginacionOpciones {
  page?: number;
  limit?: number;
  orden?: OrdenPeliculas;
}

export interface QueryOpciones extends PaginacionOpciones {
  filtroPeriodo?: FiltroPeriodo;
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
