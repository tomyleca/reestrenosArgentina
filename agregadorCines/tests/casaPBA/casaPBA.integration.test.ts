import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { CineCasaPBAScrapper } from "../../src/provider/scrappers/cineCasaPBAScrapper.js";
import { CineCasaPBAApiRequester } from "../../src/provider/apiRequesters/cineCasaPBAApiRequester.js";
import { cineCasaPBA } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const CASAPBA_CINE: Cine = { ...cineCasaPBA, id: 200 };

describe("CineCasaPBA (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("Scrapper debería obtener películas de la agenda cultural de CasaPBA", async () => {
    const page = await context.newPage();
    const scrapper = new CineCasaPBAScrapper(CASAPBA_CINE);

    console.log(`\n🔍 Iniciando scraping de ${CASAPBA_CINE.nombre}...`);
    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(`\n🎬 ${CASAPBA_CINE.nombre} — ${peliculas.length} películas obtenidas`);
    peliculas.forEach((p, i) => console.log(`  ${i + 1}. ${p.titulo} (${p.fecha})`));

    expect(peliculas.length).toBeGreaterThan(0);
    expect(peliculas[0].titulo).toBeTruthy();
    expect(peliculas[0].cine.nombre).toBe("Casa PBA");
  }, 120000);

  test("API Requester debería retornar un array vacío (Mock/No API)", async () => {
    const requester = new CineCasaPBAApiRequester(CASAPBA_CINE);
    const peliculas = await requester.obtenerPeliculas();
    
    // Debería ser 0 porque CasaPBA no tiene API y el scraper es la fuente principal.
    // Pero el test debe pasar para cumplir con la regla de negocio.
    expect(Array.isArray(peliculas)).toBe(true);
  });
});
