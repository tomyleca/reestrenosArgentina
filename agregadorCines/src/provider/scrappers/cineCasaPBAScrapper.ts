import type { Cine } from "../../core/domain/cine.js";
import { Scraper } from "../scraper.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

export class CineCasaPBAScrapper extends Scraper {
  public override cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy(0, 500));
  }

  protected override async scrapear(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(`No hay selectores para ${this.cine.nombre}`);
    }

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (container, { sel, cine }) => {
        const content = container[0];
        if (!content) return [];

        const results: any[] = [];
        let fechaActual: string | null = null;

        const selectorCombinado = [sel.fecha, sel.titulo].filter(Boolean).join(", ");
        const elements = Array.from(content.querySelectorAll(selectorCombinado));

        elements.forEach((el) => {
          // Si el elemento no es nulo, dividimos su contenido HTML por saltos de línea (<br> o similares)
          const lines = el.innerHTML.split(/<br\s*\/?>/i);
          
          lines.forEach((lineHtml) => {
            // Creamos un dummy element para extraer limpiamente el texto de la línea
            const text = lineHtml.replace(/<[^>]+>/g, "").trim();
            if (!text) return;

            const matchFecha = text.match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+(\d+)/i);
            
            // Si la línea contiene una fecha, actualizamos la fecha global
            if (sel.fecha && el.matches(sel.fecha) && matchFecha || matchFecha) {
              fechaActual = `${matchFecha[1]} ${matchFecha[2]}`;
            }

            const esPelicula = /\d{2}\.\d{2}\s*h\./i.test(text);

            if (esPelicula && el.tagName === "P") {
              const match = text.match(/\d{2}\.\d{2}\s*h\.\s*([^(\.]+)/i);
              const titulo = (match && match[1]) ? match[1].trim() : text;

              results.push({
                titulo: titulo,
                cine: cine,
                fecha: fechaActual,
              });
            }
          });
        });

        return results;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
