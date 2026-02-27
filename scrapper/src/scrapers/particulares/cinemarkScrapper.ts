import { BaseScraper } from "../baseScraper.js";
import type { CineScrapper } from "../../interfaces/cineScrapper.js";
import type { PeliculaSelectors } from "../../interfaces/selectors.js";
import type { PeliculaInput } from "../../interfaces/peliculaInput.js";
import type {Page} from 'playwright';
import type { Cine } from "../../interfaces/cine.js";

export class CinemarkScrapper extends BaseScraper implements CineScrapper {
	cine: Cine
	constructor(cine : Cine) {
		super();
		this.cine = cine;
	}

	//creo que hace falta pq el metodo padre es protected y lo tengo que adecuar a la interfaz.
	async scrapear(page: Page): Promise<PeliculaInput[]> {
		return await super.scrapear(page);
	}




}