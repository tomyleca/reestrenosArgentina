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
    // Espera para Cloudflare y carga de contenido
    await page.waitForTimeout(3000);
    // Scroll para asegurar carga de elementos dinámicos
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
  }

  protected override async scrapearPaginaCiclo(
    page: Page,
  ): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(`No hay selectores para ${this.cine.nombre}`);
    }

    // Malba requiere un override porque su estructura de programación es "plana" (flat).
    // A diferencia de otros cines donde la fecha está dentro de un contenedor de película,
    // en Malba la fecha es un encabezado (H3 o P fuerte) que precede a una lista de películas hermanas.
    // Esta lógica secuencial permite "recordar" la fecha hasta encontrar la siguiente.
    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (container, { sel, cine }) => {
        // Malba tiene una estructura "flat" (plana). La fecha puede ser un elemento separado (H3, fuerte)
        // o estar dentro del mismo párrafo que contiene los enlaces de las películas.
        const content = container[0];
        if (!content) return [];

        // 1. Intentar encontrar una fecha "global" o inicial en la cabecera del ciclo
        //ej sabados de marzo
		const encabezado = document.querySelector(".elementor-widget-theme-post-title, .elementor-heading-title");
        let fechaGlobal: string | null = null;
        if (encabezado) {
          const text = encabezado.parentElement?.innerText || "";
          const match = text.match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)s?\s+(de\s+\w+\s+|a las\s+|\d+)/i);
          if (match) fechaGlobal = match[0].trim();
        }

        const results: any[] = [];
        let fechaActual: string | null = fechaGlobal;

        // Recorremos todos los elementos relevantes
        const selectorCombinado = [sel.fecha, sel.titulo].filter(Boolean).join(", ");
        const elements = Array.from(content.querySelectorAll(selectorCombinado));

        elements.forEach((el) => {
          // Si es un posible elemento de fecha
          const text = el.textContent?.trim() || "";
          const esDatePattern = /(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)s?\s+(\d+|de|a las)/i.test(text);

          if (sel.fecha && el.matches(sel.fecha) && esDatePattern) {
            fechaActual = text;
          }

          // Si es una película
          if (sel.titulo && el.matches(sel.titulo)) {
            // Si el propio elemento NO era la fecha, pero su texto contiene un patrón de fecha antes del título
            // (Sucede cuando el selector de fecha es 'p' y el título está adentro)
            const parentText = el.parentElement?.textContent || "";
            const matchInParent = parentText.match(/^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)s?\s+(\d+|de|a las)/i);
            
            let fechaPelicula = fechaActual;
            if (matchInParent) {
              fechaPelicula = matchInParent[0].trim();
            }

            results.push({
              titulo: el.textContent?.trim() || "Sin título",
              cine: cine,
              fecha: fechaPelicula,
            });
          }
        });

        return results;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
