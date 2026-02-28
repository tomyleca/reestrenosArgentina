import type { Pelicula } from "../core/pelicula.js";
import type { PeliculaInput } from "../core/peliculaInput.js";
import type { Cine } from "../core/cine.js";
import type { Scraper } from "../scrapers/scraper.js";
import type { INormalizadorPeliculas } from "../core/normalizadorPeliculas.js";
import type { ICarteleraRepository } from "../repositories/carteleraRepository.js";
import { chromium } from 'playwright';


export interface IPeliculaService {
	normalizador: INormalizadorPeliculas;
	carteleraRepository: ICarteleraRepository
	refrescarPeliculas(scrapers: Scraper[]): Promise<Boolean>
	scrapearCines(scrapers: Scraper[]): Promise<PeliculaInput[]>;
	normalizarPeliculas(peliculasInput: PeliculaInput[]): Pelicula[];
}

export class PeliculaService implements IPeliculaService {
	normalizador: INormalizadorPeliculas;
	carteleraRepository: ICarteleraRepository
	constructor(carteleraRepository: ICarteleraRepository, normalizador: INormalizadorPeliculas) {
		this.carteleraRepository = carteleraRepository;
		this.normalizador = normalizador;
	}	

	async refrescarPeliculas(scrapers: Scraper[]): Promise<Boolean> {
	//traigo las peliculas desde los cines
	const peliculasInput = this.scrapearCines(scrapers);

	const peliculas = this.normalizarPeliculas(await peliculasInput);
	return true;
	}


	async scrapearCines(scrapers: Scraper[]): Promise<PeliculaInput[]>{
		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();


		let peliculasInput: PeliculaInput[] = [];
		const promises = scrapers.map(scraper => scraper.ejecutar(page));
		Promise.all(promises).then(results => {
			results.forEach(result => {
				peliculasInput = peliculasInput.concat(result);
			});
		});

		return peliculasInput;
	}

	normalizarPeliculas(peliculasInput: PeliculaInput[]): Pelicula[] {
		return this.normalizador.normalizar(peliculasInput);
	}

}