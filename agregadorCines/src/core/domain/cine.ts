import type { Localidad } from "./localidad.js";
import type { Pelicula } from "./pelicula.js";
import type { PeliculaSelectors } from "../../provider/types/selectors.js";

export interface Cine {
  id: number;
  nombre: string;
  localidad: Localidad;
  url: string;
  // true: la cartelera sale de sus funciones de hoy en adelante.
  // false: sale de las películas vistas en el último scraping exitoso.
  tieneFunciones: boolean;
  // Último scraping exitoso del cine
  ultimaActualizacion?: Date | null;
  api_url?: string | null;
  api_headers?: Record<string, string>;
  selectors?: PeliculaSelectors;
}
