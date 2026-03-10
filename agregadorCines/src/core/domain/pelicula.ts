import type { Genero } from "./genero.js";
import { Categoria } from "./categoria.js";
import type { Cine } from "./cine.js";
import type { Funcion } from "./funcion.js";

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
  funciones?: Funcion[];
}

const UN_ANIO_MS = 1000 * 60 * 60 * 24 * 365;
let DIFERENCIA_MAXIMA_PARA_REESTRENO = UN_ANIO_MS;

export function calcularCategoria(fechaLanzamiento: Date): Categoria {
  const diff = Date.now() - fechaLanzamiento.getTime();
  return diff > DIFERENCIA_MAXIMA_PARA_REESTRENO
    ? Categoria.REESTRENOS
    : Categoria.ESTRENOS;
}

export function agregarCine(pelicula: Pelicula, cine: Cine): void {
  if (!pelicula.cines.some((c) => c.id === cine.id)) {
    pelicula.cines.push(cine);
  }
}

export function agregarFechaFuncion(
  pelicula: Pelicula,
  fecha?: string | Date | null,
): void {
  if (!fecha) return;

  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(date.getTime())) return;

  if (!pelicula.funciones) {
    pelicula.funciones = [];
  }

  if (!pelicula.funciones.some((f) => f.fecha.getTime() === date.getTime())) {
    pelicula.funciones.push({ fecha: date });
  }
}
