import type { Localidad } from "./localidad.js";
import type { Pelicula } from "./pelicula.js";
import type { PeliculaSelectors } from "./selectors.js";

export interface Cine {
	id: number;
	nombre: string;
	localidad: Localidad;
	url: string
	selectors?: PeliculaSelectors;
}