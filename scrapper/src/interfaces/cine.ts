import type { Localidad } from "./localidad.js";

export interface Cine {
	id: number;
	nombre: string;
	localidad: Localidad;
	url: string
}