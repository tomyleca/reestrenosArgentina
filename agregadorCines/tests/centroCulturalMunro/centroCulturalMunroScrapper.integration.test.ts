import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { CentroCulturalMunroScrapper } from "../../src/provider/scrappers/centroCulturalMunroScrapper.js";
import { centroCulturalMunro } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const MUNRO_CINE: Cine = { ...centroCulturalMunro, id: 101 };

describe("CentroCulturalMunroScrapper — DOM scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas scrapeando el DOM de Lumiton para Munro", async () => {
    const page = await context.newPage();
    const scrapper = new CentroCulturalMunroScrapper(MUNRO_CINE);

    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(
      `\n🎬 Centro Cultural Munro DOM scraping — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo} (${p.fecha})`));

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      expect(p.cine.nombre).toBe("Centro Cultural Munro");
    });
  }, 60000);
});
