import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import { Scraper } from "../scraper.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { cinepolisApiMapper, cinepolisGraphqlMapper } from "../mappers/cinepolisMapper.js";

export class CinepolisScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  // Cinepolis migró a Next.js con una API GraphQL en api-g.cinepolis.com.
  // Los microfrontends se cargan asincrónicamente. Interceptamos las requests
  // GraphQL al servicio de miscellaneous (donde están las películas en cartelera).
  // Si la intercepción falla (timeout u otro error), se pasa al scraping de DOM.
  // Osea esta clase viene a ser un híbrido entre scraper y api requester.(es lo que hay!)
  public override async ejecutar(page: Page): Promise<PeliculaInput[]> {
    try {
      // Interceptamos específicamente la query que trae las películas en el endpoint de billboards
      const responsePromise = page.waitForResponse(
        async (r) => {
          if (!r.url().includes("v2/billboards/graphql") || r.status() !== 200) {
            return false;
          }
          try {
            const json = await r.json();
            return !!(json?.data?.movies?.edges);
          } catch {
            return false;
          }
        },
        { timeout: 35000 },
      );

      await page.goto(this.cine.url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const apiResponse = await responsePromise;
      const data = await apiResponse.json();
      return cinepolisGraphqlMapper(data, this.cine);
    } catch (err: any) {
      console.warn(
        `⚠️ Intercepción de API fallida para ${this.cine.nombre} (${err.message}), usando scraping de DOM como fallback.`,
      );
      // si falla eso, scrappeo normalmente
      return super.ejecutar(page);
    }
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
  }
}

