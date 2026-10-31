import type { Cine } from "../../core/domain/cine.js";
import { CicloScrapper } from "../cicloScrapper.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { parsearCiclo, parsearPeliculaUnica } from "./parsers/lugonesParser.js";

export class CineSalaLugonesScrapper extends CicloScrapper {
  public override cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
  }

  // Cada página /produccion/... es un ciclo con varias películas o una sola
  // película. En el navegador solo se extrae el texto; lugonesParser lo interpreta.
  protected override async scrapearPaginaCiclo(
    page: Page,
  ): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(`No hay selectores para ${this.cine.nombre}`);
    }

    const { titulo, bloques } = await page.$$eval(
      this.cine.selectors.containerPelicula,
      (containers) => {
        const container = containers[0];
        const titulo = document.querySelector("h1")?.textContent?.trim();
        if (!container) return { titulo, bloques: [] as string[][] };

        // Líneas de cada párrafo y subtítulo, en el orden de la página
        const bloques = Array.from(
          container.querySelectorAll<HTMLElement>("p, h4"),
        )
          .map((el) =>
            el.innerText
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean),
          )
          .filter((lineas) => lineas.length > 0);
        return { titulo, bloques };
      },
    );

    const delCiclo = parsearCiclo(bloques);
    const esCiclo = delCiclo.length > 0;
    const funciones = esCiclo ? delCiclo : parsearPeliculaUnica(titulo, bloques);

    return funciones.map((f) => ({
      titulo: f.titulo,
      cine: this.cine,
      fecha: f.fecha,
      ...(esCiclo && titulo ? { ciclo: titulo } : {}),
      ...(f.director ? { director: f.director } : {}),
      ...(f.anioLanzamiento ? { anioLanzamiento: f.anioLanzamiento } : {}),
      ...(f.textoRaw ? { textoRaw: f.textoRaw } : {}),
    }));
  }
}
