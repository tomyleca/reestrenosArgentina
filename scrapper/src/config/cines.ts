import type { Cine } from "../core/domain/cine.js";
import type { Scraper } from "../scrapers/scraper.js";
import { CinemarkScrapper } from "../scrapers/providers/cinemarkScrapper.js";
import { CinepolisScrapper } from "../scrapers/providers/cinepolisScrapper.js";
import selectorsData from "./selectors.json" with { type: "json" };

// El id lo genera Prisma. Acá solo definimos los datos de configuración.
// Los selectors no se guardan en DB porque son detalles de scraping, no de dominio.
type CineConfig = Omit<Cine, "id">;

export const cinemarkHoyts: CineConfig = {
  nombre: "Cinemark",
  localidad: "CABA",
  url: "https://www.cinemark.com.ar/",
  selectors: {
    containerPelicula: selectorsData.cinemarkHoyts.container,
    titulo: selectorsData.cinemarkHoyts.title,
    nombreBoton: selectorsData.cinemarkHoyts.nombreBoton,
  },
};

export const cinepolis: CineConfig = {
  nombre: "Cinepolis",
  localidad: "CABA",
  url: "https://www.cinepolis.com.ar/",
  selectors: {
    containerPelicula: selectorsData.cinepolis.container,
    titulo: selectorsData.cinepolis.title,
  },
};

export const cinesConfig: CineConfig[] = [cinemarkHoyts, cinepolis];

// Mapea el nombre del cine a su clase de scraper.
// Decisión de infraestructura: el dominio no sabe nada de scrapers.
export const scraperRegistry = new Map<string, new (cine: Cine) => Scraper>([
  ["Cinemark", CinemarkScrapper],
  ["Cinepolis", CinepolisScrapper],
]);
