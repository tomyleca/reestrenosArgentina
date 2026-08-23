import type { Cine } from "../../core/domain/cine.js";
import { CicloScrapper } from "../cicloScrapper.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

export class CineMalbaScrapper extends CicloScrapper {
  public override cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
  }

  protected override async scrapearPaginaCiclo(
    page: Page,
  ): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(`No hay selectores para ${this.cine.nombre}`);
    }

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (container, { sel, cine }) => {
        const content = container[0];
        if (!content) return [];

        const encabezado = document.querySelector(
          ".elementor-widget-theme-post-title, .elementor-heading-title, .page-title",
        );
        let fechaGlobal: string | null = null;
        if (encabezado) {
          const text = encabezado.parentElement?.innerText || "";
          const match = text.match(
            /(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)s?\s+(de\s+\w+\s+|a las\s+|\d+)/i,
          );
          if (match) fechaGlobal = match[0].trim();
        }

        const tituloCiclo = encabezado?.textContent?.trim();

        const results: any[] = [];
        let fechaActual: string | null = fechaGlobal;

        const selectorCombinado = [sel.fecha, sel.titulo].filter(Boolean).join(", ");
        const elements = Array.from(content.querySelectorAll(selectorCombinado));

        elements.forEach((el) => {
          const text = el.textContent?.trim() || "";
          const esDatePattern =
            /(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)s?\s+(\d+|de|a las)/i.test(
              text,
            );

          if (sel.fecha && el.matches(sel.fecha) && esDatePattern) {
            fechaActual = text;
          }

          if (sel.titulo && el.matches(sel.titulo)) {
            const parentText = el.parentElement?.textContent || "";
            const matchInParent = parentText.match(
              /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)s?\s+(\d+|de|a las)/i,
            );

            let fechaPelicula = fechaActual;
            if (matchInParent) {
              fechaPelicula = matchInParent[0].trim();
            }

            const matchAnio = parentText.match(/\b(19\d{2}|20\d{2})\b/);
            const anioLanzamiento = matchAnio?.[1] ? parseInt(matchAnio[1], 10) : undefined;

            // Malba utiliza el formato "De [Nombre Director]" o "Dir. [Nombre Director]"
            const matchDirector = parentText.match(/(?:De|Dir\.?)\s+([A-Z][a-zñáéíóú]+(?:\s+[A-Z][a-zñáéíóú]+)+)/);
            const director = matchDirector?.[1] ? matchDirector[1].trim() : undefined;

            results.push({
              titulo: el.textContent?.trim() || "Sin título",
              cine: cine,
              fecha: fechaPelicula,
              anioLanzamiento,
              ciclo: tituloCiclo || undefined,
              director,
              textoRaw: parentText.trim() || undefined,
            });
          }
        });

        return results;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
