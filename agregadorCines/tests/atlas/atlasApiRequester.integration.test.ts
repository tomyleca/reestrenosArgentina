// test de integración: verifica que AtlasApiRequester obtiene la cartelera de
// todos los complejos de Atlas desde /Funciones/GetPeliculasPorComplejo.

import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { AtlasApiRequester } from "../../src/provider/apiRequesters/atlasApiRequester.js";
import { cineAtlas } from "../../src/config/cinesConfig.js";

const ATLAS: Cine = { ...cineAtlas, id: 10 };

describe("AtlasApiRequester (integración)", () => {
  test("debería obtener películas de todos los complejos con título", async () => {
    const peliculas = await new AtlasApiRequester(ATLAS).obtenerPeliculas();

    console.log(`\n🎬 Atlas API — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) =>
      console.log(
        `  ${i + 1}. ${p.titulo}${p.ciclo ? ` [${p.ciclo}]` : ""}${p.textoRaw ? ` (${p.textoRaw})` : ""}`,
      ),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.titulo).not.toMatch(/^BARS:/i);
      expect(p.cine.nombre).toBe("Atlas");
    });
  });
});
