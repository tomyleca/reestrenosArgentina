// test de integración: verifica que AtlasScrapper, el respaldo de la API,
// obtiene películas de la home de atlascines.com.

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { AtlasScrapper } from "../../src/provider/scrappers/atlasScrapper.js";
import { cineAtlas } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const ATLAS: Cine = { ...cineAtlas, id: 10 };

describe("AtlasScrapper — DOM scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.browser()?.close();
  });

  test("debería obtener películas de la home sin preventas", async () => {
    const page = await context.newPage();
    const peliculas = await new AtlasScrapper(ATLAS).ejecutar(page);
    await page.close();

    console.log(`\n🎬 Atlas DOM scraping — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) =>
      console.log(`  ${i + 1}. ${p.titulo}${p.ciclo ? ` [${p.ciclo}]` : ""}`),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.titulo).not.toMatch(/^BARS:/i);
      expect(p.cine.nombre).toBe("Atlas");
    });
  });
});
