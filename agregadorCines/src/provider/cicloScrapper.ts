import type { Page } from "playwright";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import { Scraper } from "./scraper.js";

// Clase base para cines cuya home está dividida en ciclos.
// Navega a cada ciclo y acumula las películas de todos.
// Requiere que selectors.ciclo esté definido — si no, lanza un error en tiempo de ejecución.
export abstract class CicloScrapper extends Scraper {
  protected override async scrapear(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors?.ciclo) {
      throw new Error(
        `CicloScrapper requiere el selector "ciclo" para el cine "${this.cine.nombre}".`,
      );
    }
	//obtengo urls de los distintos ciclos
    const urlsCiclos = await this.obtenerUrlsCiclos(
      page,
      this.cine.selectors.ciclo,
    );

    console.log(
      `[CicloScrapper] ${this.cine.nombre} - Ciclos encontrados: ${urlsCiclos.length}`,
    );

    const resultados: PeliculaInput[] = [];

    for (const url of urlsCiclos) {
      // Navegamos al ciclo usando domcontentloaded por consistencia
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      // Cada página de ciclo también podría necesitar preparación básica
      await this.prepararPagina(page);

      // Delegamos la extracción de esta página particular
      const peliculasCiclo = await this.scrapearPaginaCiclo(page);
      resultados.push(...peliculasCiclo);
    }

    return resultados;
  }

  protected async scrapearPaginaCiclo(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) return [];

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (elements, { sel, cine }) => {
        return elements.flatMap((el) => {
          const titulos = el.querySelectorAll(sel.titulo);
          const fecha = sel.fecha
            ? el.querySelector(sel.fecha)?.textContent?.trim()
            : null;

          if (titulos.length === 0) return [];

          return Array.from(titulos).map((tituloEl) => ({
            titulo: tituloEl.textContent?.trim() || "Sin título",
            cine: cine,
            fecha: fecha,
          }));
        });
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }

  private async obtenerUrlsCiclos(
    page: Page,
    selectorCiclo: string,
  ): Promise<string[]> {
    return page.$$eval(selectorCiclo, (elementos) => {
      const urls = elementos
        .map((el) => {
          const anchor = el.tagName === "A" ? el : el.closest("a");
          return (anchor as HTMLAnchorElement | null)?.href ?? null;
        })
        .filter((href): href is string => href !== null);
      return [...new Set(urls)];
    });
  }
}
