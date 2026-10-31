export type Localidad =
  | "CABA"
  | "GBA"
  | "ZONA_SUR"
  | "GBA_ZONA_NORTE"
  | "GBA_ZONA_SUR"
  | "GBA_ZONA_ESTE"
  | "GBA_ZONA_OESTE";

export interface Genero {
  tmdbId: number;
  nombre: string;
}

export interface Cine {
  id: number;
  nombre: string;
  url: string;
  localidad?: Localidad;
  /** true: publica funciones con fecha. false: solo sabemos que la película está en cartelera. */
  tieneFunciones: boolean;
  /** Último scraping exitoso del cine (ISO). */
  ultimaActualizacion?: string | null;
}

export interface Funcion {
  id: number;
  /** Instante ISO. Mientras los scrapers no traigan el horario, es las 00:00 de Argentina. */
  fecha: string;
  cineId: number;
}

export interface Pelicula {
  id: number;
  titulo: string;
  descripcion: string;
  generos: Genero[];
  duracionMinutos: number;
  /** Cines donde la película está en cartelera. */
  cines: Cine[];
  /** Funciones de hoy en adelante, ordenadas por fecha. */
  funciones: Funcion[];
  poster_path?: string | null;
  popularidad?: number | null;
  fechaLanzamiento?: string | null;
}
