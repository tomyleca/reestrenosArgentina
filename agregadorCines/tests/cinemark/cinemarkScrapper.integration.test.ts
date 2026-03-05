import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext, Page } from "playwright";
import { CinemarkScrapper } from "../../src/provider/scrappers/cinemarkScrapper.js";
import type { Cine } from "../../src/core/domain/cine.js";
import path from "path";
import { fileURLToPath } from "url";
import { cinemarkHoyts } from "../../src/config/cinesConfig.js";
import { crearContextoScraping } from "../../src/provider/browserContext.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("CinemarkScrapper", () => {
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    context = await crearContextoScraping();
    page = await context.newPage();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería scrapear películas de Cinemark y devolver resultados no nulos", async () => {
    const cine: Cine = {
      ...cinemarkHoyts,
      id: 1,
    };

    console.log("\n🔍 Selectores utilizados:");
    console.log(`   Container: ${cine.selectors?.containerPelicula}`);
    console.log(`   Título: ${cine.selectors?.titulo}\n`);

    const scrapper = new CinemarkScrapper(cine);

    console.log("\n🎬 Iniciando scraping de Cinemark...\n");
    const peliculas = await scrapper.ejecutar(page);

    const screenshotPath = path.join(
      __dirname,
      "..",
      "screenshots",
      "cinemark-screenshot.png",
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Captura de pantalla guardada en: ${screenshotPath}\n`);

    console.log(`\n📊 Resultados obtenidos: ${peliculas.length} películas\n`);
    console.log("━".repeat(60));

    if (peliculas.length > 0) {
      peliculas.forEach((pelicula, index) => {
        console.log(`\n🎥 Película ${index + 1}:`);
        console.log(`   Título: ${pelicula.titulo}`);
      });
    } else {
      console.log(
        "\n⚠️  No se encontraron películas. Verifica los selectores.",
      );
    }

    expect(peliculas).not.toBeNull();
    expect(Array.isArray(peliculas)).toBe(true);
    expect(peliculas.length).toBeGreaterThan(0);

    peliculas.forEach((pelicula) => {
      expect(pelicula.titulo).toBeDefined();
      expect(pelicula.titulo).not.toBe("");
      expect(pelicula.cine.nombre).toBe("Cinemark");
    });
  }, 60000);
});
