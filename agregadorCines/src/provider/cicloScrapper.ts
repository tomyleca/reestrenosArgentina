import type { Page } from "playwright";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import { Scraper } from "./scraper.js";

// Clase base para cines cuya home está dividida en ciclos.
// Navega a cada ciclo y acumula las películas de todos.
// Requiere que selectors.ciclo esté definido — si no, lanza un error en tiempo de ejecución.
export abstract class CicloScrapper extends Scraper {
  public override async ejecutar(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors?.ciclo) {
      throw new Error(
        `CicloScrapper requiere el selector "ciclo" para el cine "${this.cine.nombre}".`,
      );
    }

    await page.goto(this.cine.url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await this.prepararPagina(page);

    const urlsCiclos = await this.obtenerUrlsCiclos(
      page,
      this.cine.selectors.ciclo,
    );

    const resultados: PeliculaInput[] = [];

    for (const url of urlsCiclos) {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await this.prepararPagina(page);
      const peliculasCiclo = await this.scrapear(page);
      resultados.push(...peliculasCiclo);
    }

    return resultados;
  }

  private async obtenerUrlsCiclos(
    page: Page,
    selectorCiclo: string,
  ): Promise<string[]> {
    return page.$$eval(selectorCiclo, (elementos) =>
      elementos
        .map((el) => {
          const anchor = el.tagName === "A" ? el : el.closest("a");
          return (anchor as HTMLAnchorElement | null)?.href ?? null;
        })
        .filter((href): href is string => href !== null),
    );
  }
}
