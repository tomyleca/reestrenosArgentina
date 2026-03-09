import "dotenv/config";
import http from "http";
import cron from "node-cron";
import type { BrowserContext } from "playwright";

import { TMDB } from "./adapters/tmdb.js";
import { TMDBAdapter } from "./adapters/tmdbAdapter.js";
import { PrismaCarteleraRepository } from "./repositories/carteleraRepository.js";
import { NormalizadorPeliculas } from "./utils/normalizadorPeliculas.js";
import { PeliculaService } from "./services/peliculaService.js";
import { cinesConfig } from "./config/cinesConfig.js";
import { providerRegistry } from "./config/providerRegistry.js";
import { crearContextoScraping } from "./provider/browserContext.js";

//DEFINICIONES

const REFRESH_SECRET = process.env.REFRESH_SECRET;
if (!REFRESH_SECRET)
  throw new Error("❌ Falta la variable de entorno REFRESH_SECRET.");

const carteleraRepository = new PrismaCarteleraRepository();
const tmdb = new TMDB();
const tmdbAdapter = new TMDBAdapter(tmdb, carteleraRepository);
const normalizador = new NormalizadorPeliculas(tmdbAdapter);
const peliculaService = new PeliculaService(carteleraRepository, normalizador);

const iniciar = async () => {
  const cinesDB = await Promise.all(
    cinesConfig.map(async (config) => {
      const cine = await carteleraRepository.upsertCine(config);
      return {
        ...cine,
        ...(config.selectors && { selectors: config.selectors }),
      };
    }),
  );

  const refrescarCartelera = async () => {
    console.log("🎬 Iniciando refresco de cartelera...");

    // Factory y no Promise directa por dos razones:
    // 1. Laziness: una Promise ejecuta inmediatamente al construirse, abriría el browser
    //    aunque todas las APIs respondan correctamente y ningún provider use el fallback.
    // 2. Cada llamada devuelve una Page nueva dentro del mismo BrowserContext,
    //    evitando que múltiples providers compartan la misma instancia de Page.
    // El cierre del browser está garantizado en el finally.
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

    try {
      const providers = cinesDB.map((cine) => {
        //busco el providerFactory registrado para el cine
        const factory = providerRegistry.get(cine.nombre);
        if (!factory)
          throw new Error(
            `❌ No hay provider registrado para "${cine.nombre}".`,
          );
        //le paso el cine y la pageFactory para crear el CineProvider
        return factory(cine, pageFactory);
      });

      console.log(`🔍 Procesando ${providers.length} cines...`);
      const peliculas = await peliculaService.refrescarPeliculas(providers);
      console.log(
        `✅ Cartelera actualizada. Total películas procesadas: ${peliculas.length}`,
      );
    } catch (error) {
      console.error("❌ Error al refrescar la cartelera:", error);
    } finally {
      if (browserContext) await browserContext.browser()?.close();
    }
  };

  cron.schedule("0 17 * * 4", refrescarCartelera, {
    timezone: "America/Argentina/Buenos_Aires",
  });

  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/refresh") {
      res.writeHead(404).end();
      return;
    }

    if (req.headers.authorization !== `Bearer ${REFRESH_SECRET}`) {
      res.writeHead(401).end();
      return;
    }

    res.writeHead(202).end("Refresco iniciado.");
    await refrescarCartelera();
  });

  server.listen(3000, "0.0.0.0", () => {
    console.log("🌐 HTTP server escuchando en :3000");
  });

  console.log("⏰ Scheduler activo. Próxima ejecución: jueves 17:00 (ART).");
};

//INDEX

iniciar().catch((err) => {
  console.error("❌ Error fatal al iniciar la aplicación:");
  console.error(err);
  process.exit(1);
});
