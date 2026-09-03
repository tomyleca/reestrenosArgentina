import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { Scraper } from "../scraper.js";

export class CineYorkScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page.waitForLoadState("domcontentloaded");
    if (this.cine.selectors?.containerPelicula) {
      await page
        .waitForSelector(this.cine.selectors.containerPelicula, { timeout: 15000 })
        .catch(() => {});
    }
  }

  protected override async scrapear(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(
        `No se han definido los selectores para el cine ${this.cine.nombre}`,
      );
    }

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (elements, { sel, cine }) => {
        const seen = new Set<string>();
        const resultados: PeliculaInput[] = [];

        for (const el of elements) {
          const titulo = el.querySelector(sel.titulo)?.textContent?.trim();
          if (!titulo) continue;

          const key = titulo.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);

          const dataDate = el.getAttribute("data-date");
          const fechaTexto = sel.fecha
            ? el.querySelector(sel.fecha)?.textContent?.trim()
            : null;
          const fecha = dataDate || fechaTexto;

          const sinopsis = el.querySelector("p")?.textContent?.trim();

          const pelicula: PeliculaInput = {
            titulo,
            cine,
            fecha,
            ...(sinopsis ? { textoRaw: sinopsis } : {}),
          };

          resultados.push(pelicula);
        }

        return resultados;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
