import "dotenv/config";
import type { BrowserContext } from "playwright";

import { TMDB } from "./adapters/tmdb.js";
import { TMDBAdapter } from "./adapters/tmdbAdapter.js";
import { PrismaCarteleraRepository } from "./repositories/carteleraRepository.js";
import { NormalizadorPeliculas } from "./utils/normalizadorPeliculas.js";
import { PeliculaService } from "./services/peliculaService.js";
import { cinesConfig } from "./config/cinesConfig.js";
import { providerRegistry } from "./config/providerRegistry.js";
import { crearContextoScraping } from "./provider/browserContext.js";

const carteleraRepository = new PrismaCarteleraRepository();
const tmdb = new TMDB();
const tmdbAdapter = new TMDBAdapter(tmdb, carteleraRepository);
const normalizador = new NormalizadorPeliculas(tmdbAdapter);
const peliculaService = new PeliculaService(carteleraRepository, normalizador);

const refrescarCartelera = async () => {
  console.log("🎬 Iniciando refresco de cartelera (Standalone)...");

  let browserContext: BrowserContext | undefined;
  let contextPromise: Promise<BrowserContext> | undefined;

  const pageFactory = async () => {
    if (!browserContext) {
      if (!contextPromise) {
        contextPromise = crearContextoScraping();
      }
      browserContext = await contextPromise;
    }
    return browserContext.newPage();
  };

  // hasError en lugar de process.exit() dentro del catch, para que finally siempre corra
  let hasError = false;
  try {
    // cinesDB va dentro del try para que errores acá también sean capturados
    const cinesDB = await Promise.all(
      cinesConfig.map(async (config) => {
        const cine = await carteleraRepository.upsertCine(config);
        return {
          ...cine,
          ...(config.selectors && { selectors: config.selectors }),
        };
      }),
    );

    const providers = cinesDB.map((cine) => {
      const factory = providerRegistry.get(cine.nombre);
      if (!factory)
        throw new Error(`❌ No hay provider registrado para "${cine.nombre}".`);
      return factory(cine, pageFactory);
    });

    console.log(`🔍 Procesando ${providers.length} cines...`);
    const peliculas = await peliculaService.refrescarPeliculas(providers);
    console.log(
      `✅ Cartelera actualizada. Total películas procesadas: ${peliculas.length}`,
    );
  } catch (error) {
    console.error("❌ Error al refrescar la cartelera:", error);
    hasError = true;
  } finally {
    if (browserContext) await browserContext.browser()?.close();
    await carteleraRepository.disconnect();
  }

  if (hasError) process.exit(1);
};

refrescarCartelera()
  .then(() => {
    console.log("🏁 Proceso de refresco finalizado correctamente.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error fatal inesperado en el refresco:", err);
    process.exit(1);
  });
