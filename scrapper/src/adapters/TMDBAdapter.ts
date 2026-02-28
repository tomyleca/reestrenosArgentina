import type { Pelicula } from '../core/pelicula.js';
import type { PeliculaInput } from '../core/peliculaInput.js';
import type { IDatosPeliculaGetter } from '../interfaces/IDatosPeliculaGetter.js';

export interface ITMDBAdapter extends IDatosPeliculaGetter {
	getPeliculaFromScrapeado(peliculasInput: PeliculaInput[]): Pelicula[];
}

export class TMDBAdapter implements ITMDBAdapter {
	getPeliculaFromScrapeado(peliculasInput: PeliculaInput[]): Pelicula[] {
			return []}
	}