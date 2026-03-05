import type { Page } from "playwright";
import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "../provider/ICineProvider.js";
import { CineApiRequester } from "../provider/cineApiRequester.js";
import { CinemarkScrapper } from "../provider/scrappers/cinemarkScrapper.js";
import { CinepolisScrapper } from "../provider/scrappers/cinepolisScrapper.js";
import { ApiWithFallbackProvider } from "../provider/apiWithFallbackProvider.js";
import selectorsData from "./selectors.json" with { type: "json" };

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

// TODO: reemplazar con la URL y tipo real de la API de Cinemark cuando se conozca la estructura.
function cinemarkApiMapper(_data: unknown): PeliculaInput[] {
  throw new Error("Mapper de API de Cinemark no implementado aún.");
}

// TODO: reemplazar con la URL y tipo real de la API de Cinepolis cuando se conozca la estructura.
function cinepolisApiMapper(_data: unknown): PeliculaInput[] {
  throw new Error("Mapper de API de Cinepolis no implementado aún.");
}

type ProviderFactory = (
  cine: Cine,
  pageFactory: () => Promise<Page>,
) => ICineProvider;

export const providerRegistry = new Map<string, ProviderFactory>([
  [
    "Cinemark",
    (cine, pageFactory) =>
      new ApiWithFallbackProvider(
        cine,
        new CineApiRequester(cine, cinemarkApiMapper),
        new CinemarkScrapper(cine),
        pageFactory,
      ),
  ],
  [
    "Cinepolis",
    (cine, pageFactory) =>
      new ApiWithFallbackProvider(
        cine,
        new CineApiRequester(cine, cinepolisApiMapper),
        new CinepolisScrapper(cine),
        pageFactory,
      ),
  ],
]);
