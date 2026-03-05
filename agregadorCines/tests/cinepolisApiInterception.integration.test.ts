// test de integración: verifica que CinepolisScrapper obtiene películas
// vía intercepción de la API interna (Cloudflare impide llamarla directamente).
// Playwright navega al sitio, resuelve el challenge de Cloudflare, y el scrapper
// intercepta la respuesta JSON de /api/movies antes de que llegue al DOM.
// La presencia de `fechaLanzamiento` en el resultado prueba que los datos
// provienen de la intercepción de API y no del scraping de DOM.
//TODO chequear estos test
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../src/core/domain/cine.js";
import { CinepolisScrapper } from "../src/provider/scrappers/cinepolisScrapper.js";
import { cinepolis } from "../src/config/cinesConfig.js";
import { crearContextoScraping } from "../src/provider/browserContext.js";

const CINEPOLIS_CINE: Cine = { ...cinepolis, id: 2 };

describe("CinepolisScrapper — API interception (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.close();
  });

  test("debería obtener películas vía intercepción de API con título y fechaLanzamiento", async () => {
    const page = await context.newPage();
    const scrapper = new CinepolisScrapper(CINEPOLIS_CINE);

    const peliculas = await scrapper.ejecutar(page);
    await page.close();

    console.log(
      `\n🎬 Cinepolis API interception — ${peliculas.length} películas obtenidas`,
    );
    peliculas.forEach((p, i) =>
      console.log(
        `  ${i + 1}. ${p.titulo} (${p.fechaLanzamiento?.toISOString().split("T")[0]})`,
      ),
    );

    expect(peliculas.length).toBeGreaterThan(0);
    peliculas.forEach((p) => {
      expect(p.titulo).toBeTruthy();
      // fechaLanzamiento definido confirma intercepción de API exitosa.
      // El fallback al scraping de DOM no provee este campo.
      expect(p.fechaLanzamiento).toBeInstanceOf(Date);
      expect(p.cine.nombre).toBe("Cinepolis");
    });
  });
});
