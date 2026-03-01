import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { IDatosPeliculaGetter } from "../core/interfaces/IDatosPeliculaGetter.js";

export interface INormalizadorPeliculas {
  normalizar(peliculasInput: PeliculaInput[]): Pelicula[];
}

export class NormalizadorPeliculas implements INormalizadorPeliculas {
  datosPeliculaGetter: IDatosPeliculaGetter;

  constructor(datosPeliculaGetter: IDatosPeliculaGetter) {
    this.datosPeliculaGetter = datosPeliculaGetter;
  }

  normalizar(peliculasInput: PeliculaInput[]): Pelicula[] {
    const peliculas =
      this.datosPeliculaGetter.getPeliculaFromScrapeado(peliculasInput);
    return peliculas;
  }
}
