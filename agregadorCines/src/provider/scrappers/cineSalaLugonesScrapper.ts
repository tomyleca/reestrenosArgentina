import type { Cine } from "../../core/domain/cine.js";
import { CicloScrapper } from "../cicloScrapper.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

export class CineSalaLugonesScrapper extends CicloScrapper {
  public override cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    // Espera breve para carga de contenido
    await page.waitForTimeout(2000);
    // Scroll para asegurar que todo el contenido dinámico (si lo hay) se cargue
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
  }

  protected override async scrapearPaginaCiclo(
    page: Page,
  ): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(`No hay selectores para ${this.cine.nombre}`);
    }

    // Sala Lugones tiene una estructura "flat" secuencial dentro de .details.
    // Los títulos tienen un estilo de color específico (#993366).
    // Las fechas y horarios son textos en negrita (strong).
    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (containers, { sel, cine }) => {
        const results: any[] = [];
        let fechaActual: string | null = null;
        let horarioActual: string | null = null;

        const container = containers[0];
        if (!container) return [];

        // Buscamos todos los elementos p que contienen la información
        const paragraphs = Array.from(container.querySelectorAll("p"));

        paragraphs.forEach((p) => {
          const text = p.textContent?.trim() || "";
          if (!text) return;

          // 1. Detectar Fecha (ej: "Jueves 19", "Sábado 21")
          const diasSemana = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d+/i;
          if (diasSemana.test(text)) {
            fechaActual = text;
            return;
          }

          // 2. Ignorar Horarios (ya no son importantes)
          if (text.toLowerCase().includes("a las") && text.toLowerCase().includes("horas")) {
            return;
          }

          // 3. Detectar Título
          const tituloEl = p.querySelector(sel.titulo);
          if (tituloEl) {
            const titulo = tituloEl.textContent?.trim() || "Sin título";

            results.push({
              titulo: titulo,
              cine: cine,
              fecha: fechaActual,
            });
          }
        });

        return results;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
