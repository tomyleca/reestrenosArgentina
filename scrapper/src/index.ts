import "dotenv/config";
import cron from "node-cron";

import { TMDB } from "./adapters/tmdb.js";
import { TMDBAdapter } from "./adapters/tmdbAdapter.js";
import { PrismaCarteleraRepository } from "./repositories/carteleraRepository.js";
import { NormalizadorPeliculas } from "./utils/normalizadorPeliculas.js";
import { PeliculaService } from "./services/peliculaService.js";
import { CinemarkScrapper } from "./scrapers/providers/cinemarkScrapper.js";
import { cinesConfig } from "./config/cines.js";

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

  const scrapers = cinesDB.map((cine) => new CinemarkScrapper(cine));

  const refrescarCartelera = async () => {
    console.log("🎬 Iniciando refresco de cartelera...");
    try {
      await peliculaService.refrescarPeliculas(scrapers);
      console.log("✅ Cartelera actualizada correctamente.");
    } catch (error) {
      console.error("❌ Error al refrescar la cartelera:", error);
    }
  };

  // Todos los jueves a las 17:00 (ART)
  cron.schedule("0 17 * * 4", refrescarCartelera, {
    timezone: "America/Argentina/Buenos_Aires",
  });

  console.log("⏰ Scheduler activo. Próxima ejecución: jueves 17:00 (ART).");
};

iniciar();
