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

  // Cada ciclo (/produccion/...) lista sus funciones como una secuencia de párrafos:
  //   "Viernes 23"                       → día
  //   "A las 15 horas" / "A las 15 y 21 horas" / "A las 14.30 horas" → horarios
  //   "El ángel de la calle              → película: título en la primera línea,
  //    (Street Angel; EE.UU; 1928)          ficha técnica en la segunda,
  //    Dirección: Frank Borzage. ..."       director en una línea "Dirección:"
  // Se genera una entrada por cada horario de cada película.
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
        const container = containers[0];
        if (!container) return [];

        const ciclo = document.querySelector("h1")?.textContent?.trim();

        const regexDia =
          /^(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+\d+/i;
        const regexHorarios = /^a las\s+(.+?)\s+horas?\.?$/i;
        const regexFicha = /^\((.+)\)$/;

        let fechaActual: string | null = null;
        let horarios: string[] = [];

        container.querySelectorAll("p").forEach((p) => {
          const lineas = p.innerText
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const primera = lineas[0];
          if (!primera) return;

          // 1. Día: "Viernes 23", "Domingo 1° de noviembre"
          if (regexDia.test(primera)) {
            fechaActual = primera;
            horarios = [];
            return;
          }

          // 2. Horarios: "A las 15 y 21 horas" → ["15:00", "21:00"]
          const matchHorarios = primera.match(regexHorarios);
          if (matchHorarios?.[1]) {
            horarios = [...matchHorarios[1].matchAll(/(\d{1,2})(?:[.:](\d{2}))?/g)].map(
              (m) => `${m[1]}:${m[2] ?? "00"}`,
            );
            return;
          }

          // 3. Película: la segunda línea es la ficha "(Título original; País; Año)"
          const ficha = lineas[1]?.match(regexFicha);
          if (!ficha?.[1] || !fechaActual) return;

          const anio = ficha[1].match(/(\d{4})\s*$/)?.[1];
          const director = lineas
            .find((l) => /^dirección:/i.test(l))
            ?.replace(/^dirección:\s*/i, "")
            .replace(/\.$/, "")
            .trim();

          const base = {
            titulo: primera,
            cine,
            ...(ciclo ? { ciclo } : {}),
            ...(director ? { director } : {}),
            ...(anio ? { anioLanzamiento: parseInt(anio, 10) } : {}),
            textoRaw: lineas.join(" "),
          };

          const horariosFuncion = horarios.length > 0 ? horarios : [null];
          for (const horario of horariosFuncion) {
            results.push({
              ...base,
              fecha: horario ? `${fechaActual} ${horario}` : fechaActual,
            });
          }
        });

        return results;
      },
      { cine: this.cine },
    );
  }
}
