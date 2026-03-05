import type { Cine } from "../core/domain/cine.js";
import selectorsData from "./selectors.json" with { type: "json" };

export type CineConfig = Omit<Cine, "id">;

export const cinemarkHoyts: CineConfig = {
  nombre: "Cinemark",
  localidad: "CABA",
  url: "https://www.cinemark.com.ar/",
  api_url: "https://bff.cinemark.com.ar/api/cinema/movies",
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
  api_url: "https://www.cinepolis.com.ar/api/movies",
  selectors: {
    containerPelicula: selectorsData.cinepolis.container,
    titulo: selectorsData.cinepolis.title,
  },
};

export const cinePixel: CineConfig = {
  nombre: "Cine Pixel",
  localidad: "ZONA_SUR",
  url: "https://www.cinespixel.com.ar/",
  api_url: "https://apiv2.gaf.adro.studio/nowPlaying/103",
  selectors: {
    containerPelicula: selectorsData.cinePixel.container,
    titulo: selectorsData.cinePixel.title,
  },
};

export const cineMalba: CineConfig = {
  nombre: "Cine Malba",
  localidad: "CABA",
  url: "https://malba.org.ar/cine/",
  selectors: {
    containerPelicula: selectorsData.cineMalba.containerPelicula,
    titulo: selectorsData.cineMalba.title,
    ciclo: selectorsData.cineMalba.ciclo,
  },
};

export const cinesConfig: CineConfig[] = [
  cinemarkHoyts,
  cinepolis,
  cinePixel,
  cineMalba,
];
