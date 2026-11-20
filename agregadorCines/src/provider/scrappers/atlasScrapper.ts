import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { Scraper } from "../scraper.js";

// Respaldo de la API: la home de atlascines.com lista la cartelera de todos los
// complejos juntos, una tarjeta por película.
export class AtlasScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
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
        const vistos = new Set<string>();
        const resultados: PeliculaInput[] = [];

        for (const el of elements) {
          // Las preventas todavía no están en cartelera
          const cinta = el.querySelector(".v2-ribbon")?.textContent ?? "";
          if (/pre-?venta/i.test(cinta)) continue;

          const crudo = el.querySelector(sel.titulo)?.textContent?.trim();
          if (!crudo) continue;

          // "BARS:EL CRIADERO" es una película del festival Rojo Sangre
          const esBars = /^bars:/i.test(crudo);
          const titulo = esBars ? crudo.slice(5).trim() : crudo;
          if (!titulo) continue;

          const clave = titulo.toLowerCase();
          if (vistos.has(clave)) continue;
          vistos.add(clave);

          resultados.push({
            titulo,
            cine,
            ...(esBars
              ? { ciclo: "BARS - Buenos Aires Rojo Sangre (festival de cine de terror)" }
              : {}),
          });
        }

        return resultados;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
