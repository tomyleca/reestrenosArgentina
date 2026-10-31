import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { cineCEA } from "../../src/config/cinesConfig.js";
import { CeaApiRequester } from "../../src/provider/apiRequesters/ceaApiRequester.js";

const CEA_CINE: Cine = { ...cineCEA, id: 999 };

describe("CeaApiRequester (integración)", () => {
  test("debería obtener películas desde la API de CEA", async () => {
    const requester = new CeaApiRequester(CEA_CINE);
    const peliculas = await requester.obtenerPeliculas();

    console.log(
      `\n🎬 CEA API — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) =>
      console.log(
        `  ${i + 1}. ${p.titulo} | ${p.director || "Sin dir"} (${p.anioLanzamiento || "?"}) | ${p.fecha || "Sin fecha"}`,
      ),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("CEA");
    });
  }, 30000);
});
