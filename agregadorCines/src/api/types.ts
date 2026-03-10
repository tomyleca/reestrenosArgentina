export type FiltroPeriodo = "hoy" | "semana" | null;

export interface QueryPeliculas {
  ordenarPorPopularidad?: boolean;
}

export interface QueryReestrenos {
  periodo?: FiltroPeriodo;
}

export interface QueryOpciones {
  ordenarPorPopularidad?: boolean;
  filtroPeriodo?: FiltroPeriodo;
  soloActivas?: boolean;
}
