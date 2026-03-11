export type FiltroPeriodo = "hoy" | "semana" | null;

export interface QueryPeliculas {
  ordenarPorPopularidad?: boolean;
}

export interface QueryReestrenos {
  periodo?: FiltroPeriodo;
}

export interface PaginacionOpciones {
  page?: number;
  limit?: number;
}

export interface QueryOpciones extends PaginacionOpciones {
  ordenarPorPopularidad?: boolean;
  filtroPeriodo?: FiltroPeriodo;
  soloActivas?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
