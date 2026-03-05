import type { Page } from "playwright";
import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "./ICineProvider.js";
import type { Scraper } from "./scraper.js";

export class ScraperOnlyProvider implements ICineProvider {
  constructor(
    public readonly cine: Cine,
    private readonly scraper: Scraper,
    private readonly pageFactory: () => Promise<Page>,
  ) {}

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    const page = await this.pageFactory();
    return this.scraper.ejecutar(page);
  }
}
