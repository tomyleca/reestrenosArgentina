// test de integración: verifica que CineApiRequester obtiene películas
// directamente de la API de Cinemark (sin usar el scraper de DOM).

import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineApiRequester } from "../../src/provider/cineApiRequester.js";
import { cinemarkApiMapper } from "../../src/provider/mappers/cinemarkMapper.js";
import { cinemarkHoyts } from "../../src/config/cinesConfig.js";

const CINEMARK_CINE: Cine = { ...cinemarkHoyts, id: 1 };

describe("CineApiRequester — Cinemark (integración)", () => {
  test("debería obtener películas de la API con título", async () => {
    const requester = new CineApiRequester(CINEMARK_CINE, cinemarkApiMapper);

    const peliculas = await requester.obtenerPeliculas();

    console.log(`\n🎬 Cinemark API — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo}`));

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("Cinemark");
    });
  });
});
