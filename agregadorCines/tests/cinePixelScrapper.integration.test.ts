// test de integración: verifica que CinePixelScrapper obtiene películas
// scrapeando directamente el DOM de cinespixel.com.ar.

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../src/core/domain/cine.js";
import { CinePixelScrapper } from "../src/provider/scrappers/cinePixelScrapper.js";
import { cinePixel } from "../src/config/cinesConfig.js";
import { crearContextoScraping } from "../src/provider/browserContext.js";

const CINE_PIXEL_CINE: Cine = { ...cinePixel, id: 99 };

describe("CinePixelScrapper — DOM scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas scrapeando el DOM de cinespixel.com.ar", async () => {
    const page = await context.newPage();
    const scrapper = new CinePixelScrapper(CINE_PIXEL_CINE);

    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(
      `\n🎬 Cine Pixel DOM scraping — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo}`));

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("Cine Pixel");
    });
  });
});
