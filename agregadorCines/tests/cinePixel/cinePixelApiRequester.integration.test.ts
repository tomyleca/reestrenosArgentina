// test de integración: verifica que CineApiRequester obtiene películas
// directamente de la API GAF de Cine Pixel.
// La presencia de `titulo` e `idiomas` confirma que el mapper cinePixelApiMapper
// procesó correctamente la respuesta.

import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineApiRequester } from "../../src/provider/cineApiRequester.js";
import { cinePixelApiMapper } from "../../src/provider/mappers/cinePixelMapper.js";
import { cinePixel } from "../../src/config/cinesConfig.js";

const CINE_PIXEL_CINE: Cine = { ...cinePixel, id: 99 };

describe("CineApiRequester — Cine Pixel (integración)", () => {
  test("debería obtener películas de la API GAF con título e idiomas", async () => {
    const requester = new CineApiRequester(CINE_PIXEL_CINE, cinePixelApiMapper);

    const peliculas = await requester.obtenerPeliculas();

    console.log(
      `\n🎬 Cine Pixel API — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) =>
      console.log(`  ${i + 1}. ${p.titulo} (${p.idiomas?.join(", ")})`),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("Cine Pixel");
    });
  });
});
