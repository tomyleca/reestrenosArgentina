import type { Page } from "playwright";
import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "./ICineProvider.js";
import type { Scraper } from "./scraper.js";

interface ICineApiRequester {
  obtenerPeliculas(): Promise<PeliculaInput[]>;
}

export class ApiWithFallbackProvider implements ICineProvider {
  constructor(
    public readonly cine: Cine,
    private readonly requester: ICineApiRequester,
    private readonly scraper: Scraper,
    private readonly pageFactory: () => Promise<Page>,
  ) {}

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    try {
      return await this.requester.obtenerPeliculas();
    } catch (error) {
      console.warn(
        `⚠️ API de ${this.cine.nombre} falló, usando scraper como fallback:`,
        error,
      );
      const page = await this.pageFactory();
      return this.scraper.ejecutar(page);
    }
  }
}
