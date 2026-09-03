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
}

export interface Pelicula {
  id: number;
  titulo: string;
  descripcion: string;
  generos: Genero[];
  duracionMinutos: number;
  cines: Cine[];
  poster_path?: string | null;
  popularidad?: number | null;
  fechaLanzamiento?: string | null;
}
