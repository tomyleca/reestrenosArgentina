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
    // Los títulos tienen un estilo de color específico (#800080).
    // Las fechas y horarios son textos en negrita (strong).
    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (containers, { cine }) => {
        const results: any[] = [];
        let fechaActual: string | null = null;
        let ultimoTexto: string | null = null;

        const container = containers[0];
        if (!container) return [];

        const paragraphs = Array.from(container.querySelectorAll("p"));

        // Sala Lugones tiene dos formatos de ficha técnica:
        //   - Con coma:       (Italia, 1951)
        //   - Con punto coma: (Rocco e i suoi fratelli; Italia/Francia, 1960)
        //   - Solo año:       (1951)
        // Excluimos fichas de duración como (108'; DCP). que terminan en punto.
        const regexFichaConComa = /^\([^,]+,\s*\d{4}\)$/i;              // (texto, año)
        const regexFichaCompleta = /^\([^;]+;\s*[^;]+[;,]\s*\d{4}\)$/i; // (texto; texto; año) o (texto; texto, año)
        const regexFichaCorta = /^\([^;]+;\s*\d{4}\)$/i;                // (texto; año)
        const regexFichaAnio = /^\(\d{4}\)$/i;                          // (año)

        const regexDiaSemana = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d+/i;

        paragraphs.forEach((p) => {
          const text = p.textContent?.trim() || "";
          if (!text) return;

          // 1. Detectar Fecha (ej: "Jueves 19", "Sábado 21")
          if (regexDiaSemana.test(text)) {
            fechaActual = text;
            ultimoTexto = text;
            return;
          }

          // 2. Comprobar si es la ficha técnica que sigue al título
          const esFichaTecnica =
            regexFichaConComa.test(text) ||
            regexFichaCompleta.test(text) ||
            regexFichaCorta.test(text) ||
            regexFichaAnio.test(text);

          if (esFichaTecnica && ultimoTexto) {
            // Extraemos el año del final de la ficha técnica: ej "(Italia, 1951)" → 1951
            const matchAnio = text.match(/(\d{4})\s*\)$/);
            const anioLanzamiento = matchAnio?.[1] ? parseInt(matchAnio[1], 10) : undefined;

            results.push({
              titulo: ultimoTexto,
              cine: cine,
              fecha: fechaActual,
              anioLanzamiento,
            });
          }

          // Guardamos el texto actual para la siguiente iteración
          ultimoTexto = text;
        });

        return results;
      },
      { cine: this.cine },
    );
  }
}


