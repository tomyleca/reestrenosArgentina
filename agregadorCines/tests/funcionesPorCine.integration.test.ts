import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { BrowserContext } from "playwright";
import type { Cine } from "../src/core/domain/cine.js";
import { cinesConfig } from "../src/config/cinesConfig.js";
import { providerRegistry } from "../src/config/providerRegistry.js";
import { crearContextoScraping } from "../src/provider/browserContext.js";
import { NormalizadorFechas } from "../src/utils/normalizadorFechas.js";

// Un cine con tieneFunciones: true se muestra en la web solo por sus funciones
// de hoy en adelante. Si su provider deja de traer fechas (selector roto,
// formato nuevo), el refresco lo cuenta como fallido y el cine se apaga.
// Este test corre el provider real (API o scraper, igual que en producción)
// de cada cine que declara funciones y verifica que efectivamente las traiga.
// Usa los sitios reales pero no TMDB.
const cinesConFunciones = cinesConfig.filter((c) => c.tieneFunciones);

describe("Cines con funciones (integración)", () => {
  let context: BrowserContext;

  beforeAll(async () => {
    context = await crearContextoScraping();
  });

  afterAll(async () => {
    await context.browser()?.close();
  });

  test.each(cinesConFunciones.map((c) => [c.nombre, c] as const))(
    "%s trae funciones con fecha válida",
    async (_nombre, config) => {
      const cine: Cine = { ...config, id: 0 };
      const factory = providerRegistry.get(cine.nombre);
      expect(factory, `No hay provider registrado para "${cine.nombre}"`).toBeDefined();

      const provider = factory!(cine, () => context.newPage());
      const peliculas = await provider.obtenerPeliculas();
      const sinFecha = peliculas.filter(
        (p) => !p.fecha || !NormalizadorFechas.normalizar(String(p.fecha)),
      );

      console.log(
        `\n🎬 ${cine.nombre}: ${peliculas.length} entradas, ${peliculas.length - sinFecha.length} con fecha válida`,
      );
      sinFecha.forEach((p) => console.log(`  ⚠️ sin fecha válida: ${p.titulo} (${p.fecha ?? "sin fecha"})`));

      expect(peliculas.length, `${cine.nombre} no trajo ninguna película`).toBeGreaterThan(0);
      expect(
        peliculas.length - sinFecha.length,
        `${cine.nombre} declara tieneFunciones pero no trajo ninguna fecha válida`,
      ).toBeGreaterThan(0);
    },
    120000,
  );
});
