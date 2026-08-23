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
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollBy(0, 1000));
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
      (containers, { cine }) => {
        const results: any[] = [];
        let fechaActual: string | null = null;
        let ultimoTexto: string | null = null;

        const container = containers[0];
        if (!container) return [];

        const cicloHeader = document.querySelector("h1, h2, .sub-title, .title, .ciclo-title")?.textContent?.trim();
        const paragraphs = Array.from(container.querySelectorAll("p"));

        const regexFichaConComa = /^\([^,]+,\s*\d{4}\)$/i;
        const regexFichaCompleta = /^\([^;]+;\s*[^;]+[;,]\s*\d{4}\)$/i;
        const regexFichaCorta = /^\([^;]+;\s*\d{4}\)$/i;
        const regexFichaAnio = /^\(\d{4}\)$/i;

        const regexDiaSemana = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d+/i;

        paragraphs.forEach((p, idx) => {
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
            const matchAnio = text.match(/(\d{4})\s*\)$/);
            const anioLanzamiento = matchAnio?.[1] ? parseInt(matchAnio[1], 10) : undefined;

            // Sala Lugones ubica "Dirección: [Nombre]." en el párrafo inmediatamente posterior a la ficha técnica
            const pDireccion = paragraphs[idx + 1]?.textContent?.trim() || "";
            const pElenco = paragraphs[idx + 2]?.textContent?.trim() || "";
            const pSinopsis = paragraphs[idx + 3]?.textContent?.trim() || "";

            const matchDirector = pDireccion.match(/Dirección:\s*([^.\n]+)/i) || text.match(/Dir(?:\.|ector)?:?\s*([^,;.\n]+)/i);
            const director = matchDirector?.[1] ? matchDirector[1].trim() : undefined;

            const bloqueCompleto = [
              ultimoTexto,
              text,
              pDireccion,
              pElenco,
              pSinopsis,
            ]
              .filter(Boolean)
              .join(" ");

            results.push({
              titulo: ultimoTexto,
              cine: cine,
              fecha: fechaActual,
              anioLanzamiento,
              ciclo: cicloHeader || undefined,
              director,
              textoRaw: bloqueCompleto,
            });
          }

          ultimoTexto = text;
        });

        return results;
      },
      { cine: this.cine },
    );
  }
}
