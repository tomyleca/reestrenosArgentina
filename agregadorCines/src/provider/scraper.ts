import type { Page } from "playwright";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { PeliculaSelectors } from "./types/selectors.js";
import type { Cine } from "../core/domain/cine.js";

//Tener una clase base y heredar me sirve para manejar la distinta lógica de scrapear las páginas, por ejemplo un formulario de inicio.
//Además me permite aplicar un template method.
export abstract class Scraper {
  abstract cine: Cine; //se la pasan las clases hijas

  constructor() {}

  //template method
  public async ejecutar(page: Page): Promise<PeliculaInput[]> {
    await page.goto(this.cine.url, {
      waitUntil: "domcontentloaded", // No espera a las imágenes ni trackers
      timeout: 60000, // Aumentamos a 60s por las dudas
    });
    await this.prepararPagina(page); // Por si tengo que hacer algo antes de scrapear, como cerrar un popup
    const peliculasInput = await this.scrapear(page);
    return peliculasInput;
  }

  protected async prepararPagina(page: Page): Promise<void> {
    // Por defecto no hace nada, los hijos pueden sobrescribirlo
  }

  protected async scrapear(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(
        `No se han definido los selectores para el cine ${this.cine.nombre}`,
      );
    }

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (elements, { sel, cine }) => {
        return elements.map((el) => {
          const titulo = el.querySelector(sel.titulo)?.textContent?.trim();
          const fecha = sel.fecha
            ? el.querySelector(sel.fecha)?.textContent?.trim()
            : null;

          return {
            titulo: titulo || "Sin título",
            cine: cine,
            fecha: fecha,
          };
        });
      },
      { sel: this.cine.selectors, cine: this.cine },
    ); //Paso los parametros al eval
  }
}
