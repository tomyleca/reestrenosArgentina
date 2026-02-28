import type { Cine } from "../core/cine.js";
import type { PeliculaInput } from "../core/peliculaInput.js";
import type {Page} from 'playwright';

export interface CineScrapper {
	cine: Cine;
	
	scrapear(page: Page): Promise<PeliculaInput[]>;
}