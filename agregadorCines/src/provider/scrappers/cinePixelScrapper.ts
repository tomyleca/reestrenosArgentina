import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { Scraper } from "../scraper.js";

export class CinePixelScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
  }

  // En la tarjeta el título no tiene un elemento propio identificable (son <p>
  // sin clase), así que se lee del alt del póster.
  protected override async scrapear(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(
        `No se han definido los selectores para el cine ${this.cine.nombre}`,
      );
    }

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (elements, { sel, cine }) => {
        const vistos = new Set<string>();
        const resultados: PeliculaInput[] = [];

        for (const el of elements) {
          // Cada tarjeta arranca con una etiqueta ("EN CARTELERA", "ESTRENO",
          // "PRÓXIMO ESTRENO"): los próximos estrenos todavía no están en cartelera.
          const etiqueta = el.querySelector("p")?.textContent ?? "";
          if (/pr[oó]ximo/i.test(etiqueta)) continue;

          const titulo = el.querySelector(sel.titulo)?.getAttribute("alt")?.trim();
          if (!titulo) continue;

          const clave = titulo.toLowerCase();
          if (vistos.has(clave)) continue;
          vistos.add(clave);

          resultados.push({ titulo, cine });
        }

        return resultados;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
