export interface Genero {
  tmdbId: number;
  nombre: string;
}

export interface Cine {
  id: number;
  nombre: string;
  url: string;
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
