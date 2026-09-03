import type { Localidad } from "../core/domain/localidad.js";

export type FiltroPeriodo = "hoy" | "semana" | "mes" | null;

export interface QueryReestrenos {
  periodo?: FiltroPeriodo;
}

export interface PaginacionOpciones {
  page?: number;
  limit?: number;
}

export interface QueryOpciones extends PaginacionOpciones {
  filtroPeriodo?: FiltroPeriodo;
  soloActivas?: boolean;
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
