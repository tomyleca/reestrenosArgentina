import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { CinemarkScrapper } from "../src/scrapers/providers/cinemarkScrapper.js";
import type { Cine } from "../src/core/domain/cine.js";
import { Localidad } from "../src/core/domain/localidad.js";
import selectorsData from "../src/config/selectors.json" with { type: "json" };
import path from "path";
import { fileURLToPath } from "url";
import { cinemarkHoyts } from "../src/config/cines.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("CinemarkScrapper", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("debería scrapear películas de Cinemark y devolver resultados no nulos", async () => {
    // Configurar el cine con los selectores
    const cine: Cine = {
      ...cinemarkHoyts,
      id: 1,
    };

    console.log("\n🔍 Selectores utilizados:");
    console.log(`   Container: ${cine.selectors?.containerPelicula}`);
    console.log(`   Título: ${cine.selectors?.titulo}\n`);

    // Crear scrapper
    const scrapper = new CinemarkScrapper(cine);

    // Ejecutar el scrapping
    console.log("\n🎬 Iniciando scraping de Cinemark...\n");
    const peliculas = await scrapper.ejecutar(page);

    // Tomar captura de pantalla para depuración
    const screenshotPath = path.join(
      __dirname,
      "screenshots",
      "cinemark-screenshot.png",
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Captura de pantalla guardada en: ${screenshotPath}\n`);

    // Imprimir resultados
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

    // Si hay películas, verificar que tengan la estructura correcta
    if (peliculas.length > 0) {
      peliculas.forEach((pelicula) => {
        expect(pelicula.titulo).toBeDefined();
        expect(pelicula.titulo).not.toBe("");
        expect(pelicula.cine.nombre).toBe("Cinemark");
      });
      console.log("✅ Todos los tests pasaron correctamente\n");
    } else {
      console.log("⚠️  El test pasó pero no se encontraron películas\n");
    }
  });
});
