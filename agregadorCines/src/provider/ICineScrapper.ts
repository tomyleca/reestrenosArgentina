import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { Page } from "playwright";

export interface CineScrapper {
  cine: Cine;

  scrapear(page: Page): Promise<PeliculaInput[]>;
}
