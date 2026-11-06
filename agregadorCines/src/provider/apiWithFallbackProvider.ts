import type { Page } from "playwright";
import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "./ICineProvider.js";
import type { Scraper } from "./scraper.js";

export interface ICineApiRequester {
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
      const peliculas = await this.requester.obtenerPeliculas();
      if (peliculas.length > 0) return peliculas;
      // Una API que responde OK pero vacía suele haber cambiado de formato:
      // el scraper puede seguir funcionando.
      console.warn(
        `⚠️ API de ${this.cine.nombre} respondió sin películas, usando scraper como fallback.`,
      );
    } catch (error) {
      console.warn(
        `⚠️ API de ${this.cine.nombre} falló, usando scraper como fallback:`,
        error,
      );
    }
    return this.scrapear();
  }

  private async scrapear(): Promise<PeliculaInput[]> {
    const page = await this.pageFactory();
    try {
      return await this.scraper.ejecutar(page);
    } finally {
      await page.close();
    }
  }
}
