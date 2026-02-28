import type { Pelicula } from '../core/pelicula.js';
import type { PeliculaInput } from '../core/peliculaInput.js';

export interface IDatosPeliculaGetter {
	getPeliculaFromScrapeado(peliculasInput: PeliculaInput[]): Pelicula[];
}