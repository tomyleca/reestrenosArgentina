import type { Genero } from './genero.js';
import { Categoria } from './categoria.js';
import type { Cine } from './cine.js';

export interface Pelicula {
	id: number;
	titulo: string;
	descripcion: string;
	generos: Genero[];
	duracionMinutos: number; // Duración en minutos
	categoria: Categoria;
	cines: Cine[];
	activa: boolean;
	tmdbId?: number | null; 
}

