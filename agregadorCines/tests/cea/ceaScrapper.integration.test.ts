import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { CeaScrapper } from "../../src/provider/scrappers/ceaScrapper.js";
import { cineCEA } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const CEA_CINE: Cine = { ...cineCEA, id: 999 };

describe("CeaScrapper — DOM scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas scrapeando el DOM de CEA", async () => {
    const page = await context.newPage();
    const scrapper = new CeaScrapper(CEA_CINE);

    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(
      `\n🎬 CEA DOM scraping — ${peliculas.length} películas obtenidas`,
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
  }, 60000);
});
