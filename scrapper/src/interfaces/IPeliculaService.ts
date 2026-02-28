import type { Pelicula } from "../core/pelicula.js";
import type { PeliculaInput } from "../core/peliculaInput.js";
import type { Cine } from "../core/cine.js";
import type { Scraper } from "../scrapers/scraper.js";
import type { INormalizadorPeliculas } from "../interfaces/INormalizadorPeliculas.js";

export interface IPeliculaService {
	normalizador: INormalizadorPeliculas;
	refrescarPeliculas(): Boolean;
	scrapearCines(scrapers: Scraper[]): PeliculaInput[];
	scrapearCine(scraper: Scraper): PeliculaInput[];
	normalizarPeliculas(peliculasInput: PeliculaInput[]): Pelicula[];
}