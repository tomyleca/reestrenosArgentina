import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import { Scraper } from "../scraper.js";

export class CeaScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page.waitForLoadState("domcontentloaded");
    if (this.cine.selectors?.containerPelicula) {
      await page
        .waitForSelector(this.cine.selectors.containerPelicula, {
          timeout: 15000,
        })
        .catch(() => {});
    }
  }

  protected override async scrapear(page: Page): Promise<PeliculaInput[]> {
    if (!this.cine.selectors) {
      throw new Error(
        `No se han definido los selectores para el cine ${this.cine.nombre}`,
      );
    }

    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (elements, { sel, cine }) => {
        const seen = new Set<string>();
        const resultados: PeliculaInput[] = [];

        for (const el of elements) {
          const titleEl =
            el.querySelector(sel.titulo) || el.querySelector(".fc-title");
          const rawTitle = titleEl
            ? titleEl.innerHTML
                .replace(/<br\s*\/?>/gi, " ")
                .replace(/<[^>]+>/g, " ")
            : "";

          if (!rawTitle.trim()) continue;

          const titulo = rawTitle.replace(/\s+/g, " ").trim();
          const key = titulo.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);

          // Extraer director y año de dirAnio (ej: "Leo Fleider · 1972")
          const dirAnioText =
            el.querySelector("[data-field='dirAnio']")?.textContent?.trim() ||
            el.querySelector(".fc-dir")?.textContent?.trim();

          let director: string | undefined;
          let anioLanzamiento: number | undefined;

          if (dirAnioText) {
            const parts = dirAnioText.split("·").map((p) => p.trim());
            if (parts.length >= 2) {
              director = parts[0];
              const parsedYear = parseInt(parts[1]!, 10);
              if (!isNaN(parsedYear)) {
                anioLanzamiento = parsedYear;
              }
            } else if (parts.length === 1) {
              const parsedYear = parseInt(parts[0]!, 10);
              if (!isNaN(parsedYear)) {
                anioLanzamiento = parsedYear;
              } else {
                director = parts[0];
              }
            }
          }

          // Ciclo
          const ciclo =
            (sel.ciclo
              ? el.querySelector(sel.ciclo)?.textContent?.trim()
              : undefined) ||
            el.querySelector(".fc-cycle")?.textContent?.trim() ||
            undefined;

          // Fecha
          const dia = el
            .querySelector("[data-field='dia']")
            ?.textContent?.trim();
          const diaSemanaMes = el
            .querySelector(sel.fecha || "[data-field='diaSemanaMes']")
            ?.textContent?.trim();

          let fecha: string | undefined;
          if (dia && diaSemanaMes) {
            // diaSemanaMes suele ser "Jueves Septiembre" o "Jueves 3 de Septiembre"
            const mesMatch = diaSemanaMes.match(
              /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
            );
            if (mesMatch) {
              fecha = `${dia} de ${mesMatch[1]}`;
            } else {
              fecha = `${dia} ${diaSemanaMes}`;
            }
          } else if (diaSemanaMes) {
            fecha = diaSemanaMes;
          }

          // Sinopsis
          const sinopsis =
            el.querySelector(".fc-sinopsis")?.textContent?.trim() ||
            el.querySelector("p")?.textContent?.trim() ||
            undefined;

          const pelicula: PeliculaInput = {
            titulo,
            cine,
            ...(director ? { director } : {}),
            ...(anioLanzamiento ? { anioLanzamiento } : {}),
            ...(ciclo ? { ciclo } : {}),
            ...(fecha ? { fecha } : {}),
            ...(sinopsis ? { textoRaw: sinopsis } : {}),
          };

          resultados.push(pelicula);
        }

        return resultados;
      },
      { sel: this.cine.selectors, cine: this.cine },
    );
  }
}
