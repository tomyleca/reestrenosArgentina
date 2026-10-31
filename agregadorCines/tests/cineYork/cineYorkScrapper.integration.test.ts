import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineYorkScrapper } from "../../src/provider/scrappers/cineYorkScrapper.js";
import { cineYork } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const YORK_CINE: Cine = { ...cineYork, id: 102 };

describe("CineYorkScrapper — DOM scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas scrapeando el DOM de Lumiton para Cine York", async () => {
    const page = await context.newPage();
    const scrapper = new CineYorkScrapper(YORK_CINE);

    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(
      `\n🎬 Cine York DOM scraping — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo} (${p.fecha})`));

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("Cine York");
    });
  }, 60000);
});
