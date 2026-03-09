import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineSalaLugonesScrapper } from "../../src/provider/scrappers/cineSalaLugonesScrapper.js";
import { cineSalaLugones } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const LUGONES_CINE: Cine = { ...cineSalaLugones, id: 101 };

describe("CineSalaLugonesScrapper — Ciclo scraping (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas con fecha simplificada (solo día)", async () => {
    const page = await context.newPage();
    const scrapper = new CineSalaLugonesScrapper(LUGONES_CINE);

    console.log(`\n🔍 Iniciando scraping de ${LUGONES_CINE.nombre}...`);
    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(`\n🎬 Sala Lugones — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo} [${p.fecha || 'Sin fecha'}]`));

    expect(peliculas.length).toBeGreaterThan(0);
    expect(peliculas[0].titulo).toBeTruthy();
    
    // Verificamos que no incluya la hora (ej: "A las", "horas")
    if (peliculas[0].fecha) {
        expect(peliculas[0].fecha.toLowerCase()).not.toContain("horas");
        expect(peliculas[0].fecha.toLowerCase()).not.toContain("a las");
    }
  }, 120000);
});
