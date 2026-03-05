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

export const cinesConfig: CineConfig[] = [cinemarkHoyts, cinepolis];
