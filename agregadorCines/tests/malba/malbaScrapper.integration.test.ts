import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineMalbaScrapper } from "../../src/provider/scrappers/cineMalbaScrapper.js";
import { cineMalba } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const MALBA_CINE: Cine = { ...cineMalba, id: 100 };

describe("CineMalbaScrapper — Ciclo scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas navegando por los ciclos del Malba", async () => {
    const page = await context.newPage();
    const scrapper = new CineMalbaScrapper(MALBA_CINE);

    console.log(`\n🔍 Iniciando scraping de ${MALBA_CINE.nombre}...`);
    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(`\n🎬 Cine Malba — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo}`));

    expect(peliculas.length).toBeGreaterThan(0);
    expect(peliculas[0].titulo).toBeTruthy();
    expect(peliculas[0].cine.nombre).toBe("Cine Malba");
  }, 120000);
});
