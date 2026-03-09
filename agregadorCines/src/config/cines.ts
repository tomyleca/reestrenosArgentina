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
    containerPelicula: selectorsData.cinemarkHoyts.containerPelicula,
    titulo: selectorsData.cinemarkHoyts.titulo,
    nombreBoton: selectorsData.cinemarkHoyts.nombreBoton,
  },
};

export const cinepolis: CineConfig = {
  nombre: "Cinepolis",
  localidad: "CABA",
  url: "https://www.cinepolis.com.ar/",
  selectors: {
    containerPelicula: selectorsData.cinepolis.containerPelicula,
    titulo: selectorsData.cinepolis.titulo,
  },
};

export const cinesConfig: CineConfig[] = [cinemarkHoyts, cinepolis];
