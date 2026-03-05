// test de integración: verifica que CineApiRequester obtiene películas
// directamente de la API de Cinemark (sin usar el scraper de DOM).
// La presencia de `fechaLanzamiento` en el resultado es la prueba de que
// los datos provienen del API mapper y no del scraping de DOM.

import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineApiRequester } from "../../src/provider/cineApiRequester.js";
import { cinemarkApiMapper } from "../../src/provider/mappers/cinemarkMapper.js";
import { cinemarkHoyts } from "../../src/config/cinesConfig.js";

const CINEMARK_CINE: Cine = { ...cinemarkHoyts, id: 1 };

describe("CineApiRequester — Cinemark (integración)", () => {
  test("debería obtener películas de la API con título y fechaLanzamiento", async () => {
    const requester = new CineApiRequester(CINEMARK_CINE, cinemarkApiMapper);

    const peliculas = await requester.obtenerPeliculas();

    console.log(`\n🎬 Cinemark API — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) =>
      console.log(
        `  ${i + 1}. ${p.titulo} (${p.fechaLanzamiento?.toISOString().split("T")[0]})`,
      ),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      // fechaLanzamiento definido confirma que los datos vienen del API mapper
      // y no del scraping de DOM, que no provee este campo.
      expect(p.fechaLanzamiento).toBeInstanceOf(Date);
      expect(p.cine.nombre).toBe("Cinemark");
    });
  });
});
