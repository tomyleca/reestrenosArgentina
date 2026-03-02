import type { Cine } from "../core/domain/cine.js";
import selectorsData from "./selectors.json" with { type: "json" };

// El id lo genera Prisma. Acá solo definimos los datos de configuración.
// Los selectors no se guardan en DB porque son detalles de scraping, no de dominio.
type CineInput = Omit<Cine, "id">;

export const cinemarkHoyts: CineInput = {
  nombre: "Cinemark",
  localidad: "CABA",
  url: "https://www.cinemark.com.ar/",
  selectors: {
    containerPelicula: selectorsData.cinemarkHoyts.container,
    titulo: selectorsData.cinemarkHoyts.title,
    nombreBoton: selectorsData.cinemarkHoyts.nombreBoton,
  },
};

export const cinesConfig: CineInput[] = [cinemarkHoyts];
