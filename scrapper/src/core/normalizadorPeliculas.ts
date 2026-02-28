import type { Pelicula } from './pelicula.js';
import type { PeliculaInput } from './peliculaInput.js';
import type { IDatosPeliculaGetter } from '../interfaces/IDatosPeliculaGetter.js';

export interface INormalizadorPeliculas {
	normalizar(peliculasInput: PeliculaInput[]): Pelicula[];
}

export class NormalizadorPeliculas implements INormalizadorPeliculas {
	datosPeliculaGetter: IDatosPeliculaGetter;

	constructor(datosPeliculaGetter: IDatosPeliculaGetter) {
		this.datosPeliculaGetter = datosPeliculaGetter;
	}
	
	normalizar(peliculasInput: PeliculaInput[]): Pelicula[] {
		const peliculas = this.datosPeliculaGetter.getPeliculaFromScrapeado(peliculasInput);
		return peliculas;
	}
}