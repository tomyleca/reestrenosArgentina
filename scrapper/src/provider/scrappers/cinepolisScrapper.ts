import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import { Scraper } from "../scraper.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { cinepolisApiMapper } from "../mappers/cinepolisMapper.js";

export class CinepolisScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  // Cinepolis protege su API con Cloudflare Bot Management (cookie cf_bm),
  // lo que impide consumirla directamente con un fetch. Sin embargo, al navegar
  // con Playwright el challenge se resuelve de forma transparente y la página
  // llama a la API internamente. Interceptamos esa response desde dentro del
  // browser para obtener el JSON limpio, evitando parsear el DOM.
  // Si la intercepción falla (timeout u otro error), se pasa al scraping de DOM.
 //  Osea esta clase viene a ser un hibrido entre scraper y api requester.(es lo que hay!)
  public override async ejecutar(page: Page): Promise<PeliculaInput[]> {
    try {
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes("/api/movies") && r.status() === 200,
        { timeout: 15000 },
      );

      await page.goto(this.cine.url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const apiResponse = await responsePromise;
      const data = await apiResponse.json();
      return cinepolisApiMapper(data, this.cine);
    } catch {
      console.warn(
        `⚠️ Intercepción de API fallida para ${this.cine.nombre}, usando scraping de DOM.`,
      );
	  //si falla eso, scrappeo normalmente
      return super.ejecutar(page);
    }
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
  }
}
