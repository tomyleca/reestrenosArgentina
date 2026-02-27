import type { Cine } from "./cine.js";
import type { PeliculaInput } from "./peliculaInput.js";
import type {Page} from 'playwright';

export interface CineScrapper {
	nombreCine: string;
	url: string;
	
	scrapear(page: Page): Promise<PeliculaInput[]>;
}