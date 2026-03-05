import type { Genero } from "./genero.js";
import { Categoria } from "./categoria.js";
import type { Cine } from "./cine.js";

export interface Pelicula {
  id: number;
  titulo: string;
  descripcion: string;
  generos: Genero[];
  duracionMinutos: number;
  categoria: Categoria;
  cines: Cine[];
  activa: boolean;
  tmdbId?: number | null;
  poster_path?: string | null;
  popularidad?: number | null;
  fechaLanzamiento?: Date | null;
}

const UN_ANIO_MS = 1000 * 60 * 60 * 24 * 365;
let DIFERENCIA_MAXIMA_PARA_REESTRENO = UN_ANIO_MS;

export function calcularCategoria(fechaLanzamiento: Date): Categoria {
  const diff = Date.now() - fechaLanzamiento.getTime();
  return diff > DIFERENCIA_MAXIMA_PARA_REESTRENO ? Categoria.REESTRENOS : Categoria.ESTRENOS;
}

export function agregarCine(pelicula: Pelicula, cine: Cine): void {
  if (!pelicula.cines.some((c) => c.id === cine.id)) {
    pelicula.cines.push(cine);
  }
}
