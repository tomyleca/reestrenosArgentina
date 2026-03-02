import "dotenv/config";
import http from "http";
import cron from "node-cron";

import { TMDB } from "./adapters/tmdb.js";
import { TMDBAdapter } from "./adapters/tmdbAdapter.js";
import { PrismaCarteleraRepository } from "./repositories/carteleraRepository.js";
import { NormalizadorPeliculas } from "./utils/normalizadorPeliculas.js";
import { PeliculaService } from "./services/peliculaService.js";
import { CinemarkScrapper } from "./scrapers/providers/cinemarkScrapper.js";
import { cinesConfig } from "./config/cines.js";

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

iniciar();
