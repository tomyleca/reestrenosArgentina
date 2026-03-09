import type { Cine } from "../core/domain/cine.js";
import selectorsData from "./selectors.json" with { type: "json" };

export type CineConfig = Omit<Cine, "id">;

export const cinemarkHoyts: CineConfig = {
  nombre: "Cinemark",
  localidad: "CABA",
  url: "https://www.cinemark.com.ar/",
  api_url: "https://bff.cinemark.com.ar/api/cinema/movies",
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
  api_url: "https://www.cinepolis.com.ar/api/movies",
  selectors: {
    containerPelicula: selectorsData.cinepolis.containerPelicula,
    titulo: selectorsData.cinepolis.titulo,
  },
};

export const cinePixel: CineConfig = {
  nombre: "Cine Pixel",
  localidad: "ZONA_SUR",
  url: "https://www.cinespixel.com.ar/",
  api_url: "https://apiv2.gaf.adro.studio/nowPlaying/103",
  selectors: {
    containerPelicula: selectorsData.cinePixel.containerPelicula,
    titulo: selectorsData.cinePixel.titulo,
  },
};

export const cineMalba: CineConfig = {
  nombre: "Cine Malba",
  localidad: "CABA",
  url: "https://malba.org.ar/cine/",
  selectors: {
    containerPelicula: selectorsData.cineMalba.containerPelicula,
    titulo: selectorsData.cineMalba.titulo,
    ciclo: selectorsData.cineMalba.ciclo,
  },
};

export const cineSalaLugones: CineConfig = {
  nombre: "Sala Lugones",
  localidad: "CABA",
  url: "https://complejoteatral.gob.ar/cine",
  selectors: {
    containerPelicula: selectorsData.salaLugones.containerPelicula,
    titulo: selectorsData.salaLugones.titulo,
    ciclo: selectorsData.salaLugones.ciclo,
    fecha: selectorsData.salaLugones.fecha,
  },
};

export const cineCasaPBA: CineConfig = {
  nombre: "Casa PBA",
  localidad: "CABA",
  url: "https://gba.gob.ar/casaPBA/agenda_cultural_casa_pba",
  selectors: {
    containerPelicula: selectorsData.casaPBA.containerPelicula,
    titulo: selectorsData.casaPBA.titulo,
    fecha: selectorsData.casaPBA.fecha,
  },
};

export const cinesConfig: CineConfig[] = [
  cinemarkHoyts,
  cinepolis,
  cinePixel,
  cineMalba,
  cineSalaLugones,
  cineCasaPBA,
];
