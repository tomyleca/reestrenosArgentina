import type { Cine } from './cine.js';

export interface PeliculaInput {
	titulo: string;
	idiomas?: string[];
	cine: Cine; 
}