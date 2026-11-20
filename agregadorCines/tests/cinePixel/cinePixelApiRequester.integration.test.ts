// test de integración: verifica que CineApiRequester obtiene películas
// directamente del endpoint de cartelera del sitio de Cines Pixel
// (/Funciones/GetPeliculasPorComplejo). La presencia de `titulo` confirma que
// el mapper peliculasPorComplejoMapper procesó correctamente la respuesta.

import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineApiRequester } from "../../src/provider/cineApiRequester.js";
import {
  peliculasPorComplejoMapper,
  type PeliculaPorComplejoItem,
} from "../../src/provider/mappers/peliculasPorComplejoMapper.js";
import { cinePixel } from "../../src/config/cinesConfig.js";

const CINE_PIXEL_CINE: Cine = { ...cinePixel, id: 99 };

describe("CineApiRequester — Cine Pixel (integración)", () => {
  test("debería obtener películas del endpoint de cartelera con título", async () => {
    const requester = new CineApiRequester<PeliculaPorComplejoItem[]>(
      CINE_PIXEL_CINE,
      (data, cine) => peliculasPorComplejoMapper(data, cine),
    );

    const peliculas = await requester.obtenerPeliculas();

    console.log(
      `\n🎬 Cine Pixel API — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) =>
      console.log(`  ${i + 1}. ${p.titulo}${p.textoRaw ? ` (${p.textoRaw})` : ""}`),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("Cine Pixel");
    });
  });
});
