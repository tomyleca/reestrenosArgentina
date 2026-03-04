import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { Browser, Page } from "playwright";
import { CinepolisScrapper } from "../src/scrapers/providers/cinepolisScrapper.js";
import type { Cine } from "../src/core/domain/cine.js";
import { cinepolis } from "../src/config/cines.js";
import { crearContextoScraping } from "../src/scrapers/browserContext.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe.concurrent("CinepolisScrapper", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    const context = await crearContextoScraping();
    browser = context.browser()!;
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("debería scrapear películas de Cinepolis y devolver resultados no nulos", async () => {
    const cine: Cine = {
      ...cinepolis,
      id: 1,
    };

    console.log("\n🔍 Selectores utilizados:");
    console.log(`   Container: ${cine.selectors?.containerPelicula}`);
    console.log(`   Título: ${cine.selectors?.titulo}\n`);

    const scrapper = new CinepolisScrapper(cine);

    console.log("\n🎬 Iniciando scraping de Cinepolis...\n");
    const peliculas = await scrapper.ejecutar(page);

    const screenshotPath = path.join(
      __dirname,
      "screenshots",
      "cinepolis-screenshot.png",
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Captura de pantalla guardada en: ${screenshotPath}\n`);

    console.log(`\n📊 Resultados obtenidos: ${peliculas.length} películas\n`);
    console.log("━".repeat(60));

    if (peliculas.length > 0) {
      peliculas.forEach((pelicula, index) => {
        console.log(`\n🎥 Película ${index + 1}:`);
        console.log(`   Título: ${pelicula.titulo}`);
        console.log(`   Cine: ${pelicula.cine}`);
        if (pelicula.idiomas) {
          console.log(`   Idiomas: ${pelicula.idiomas.join(", ")}`);
        }
      });
    } else {
      console.log(
        "\n⚠️  No se encontraron películas. Verifica los selectores.",
      );
    }

    console.log("\n" + "━".repeat(60) + "\n");

    expect(peliculas).not.toBeNull();
    expect(peliculas).toBeDefined();
    expect(Array.isArray(peliculas)).toBe(true);
    expect(peliculas.length).toBeGreaterThan(0);

    if (peliculas.length > 0) {
      peliculas.forEach((pelicula) => {
        expect(pelicula.titulo).toBeDefined();
        expect(pelicula.titulo).not.toBe("");
        expect(pelicula.cine.nombre).toBe("Cinepolis");
      });
      console.log("✅ Todos los tests pasaron correctamente\n");
    } else {
      console.log("⚠️  El test pasó pero no se encontraron películas\n");
    }
  });
});
