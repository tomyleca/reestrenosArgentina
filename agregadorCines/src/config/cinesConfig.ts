import type { Cine } from "../core/domain/cine.js";
import selectorsData from "./selectors.json" with { type: "json" };

export type CineConfig = Omit<Cine, "id">;

export const cinemarkHoyts: CineConfig = {
  nombre: "Cinemark",
  localidad: "CABA",
  url: "https://www.cinemark.com.ar/",
  api_url: "https://bff.cinemark.com.ar/api/cinema/movies",
  api_headers: {
    "country": "AR",
    "origin": "https://www.cinemark.com.ar",
  },
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
  localidad: "GBA_ZONA_SUR",
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

export const centroCulturalMunro: CineConfig = {
  nombre: "Centro Cultural Munro",
  localidad: "GBA_ZONA_NORTE",
  url: "https://lumiton.ar/agenda-presencial/?lugar=centro-cultural-munro",
  selectors: {
    containerPelicula: selectorsData.centroCulturalMunro.containerPelicula,
    titulo: selectorsData.centroCulturalMunro.titulo,
    fecha: selectorsData.centroCulturalMunro.fecha,
  },
};

export const cineYork: CineConfig = {
  nombre: "Cine York",
  localidad: "GBA_ZONA_NORTE",
  url: "https://lumiton.ar/agenda-presencial/?lugar=cine-york",
  selectors: {
    containerPelicula: selectorsData.cineYork.containerPelicula,
    titulo: selectorsData.cineYork.titulo,
    fecha: selectorsData.cineYork.fecha,
  },
};

export const cineCEA: CineConfig = {
  nombre: "CEA",
  localidad: "GBA_ZONA_SUR",
  url: "https://cea.mda.gob.ar/",
  api_url:
    "https://script.google.com/macros/s/AKfycbxb6EWS0lrlgo0UBNZvWHC29Zy5Yxae9TUgVu02X_mcWKd54C9rpIrdNgCxs71y4QRH/exec",
  selectors: {
    containerPelicula: selectorsData.cea.containerPelicula,
    titulo: selectorsData.cea.titulo,
    fecha: selectorsData.cea.fecha,
    ciclo: selectorsData.cea.ciclo,
  },
};

export const cinesConfig: CineConfig[] = [
  cinemarkHoyts,
  cinepolis,
  cinePixel,
  cineMalba,
  cineSalaLugones,
  cineCasaPBA,
  centroCulturalMunro,
  cineYork,
  cineCEA,
];
