import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { IDatosPeliculaGetter } from "../core/interfaces/IDatosPeliculaGetter.js";

export interface ITMDBAdapter extends IDatosPeliculaGetter {
  getPeliculaFromScrapeado(peliculasInput: PeliculaInput[]): Pelicula[];
}

export class TMDBAdapter implements ITMDBAdapter {
  getPeliculaFromScrapeado(peliculasInput: PeliculaInput[]): Pelicula[] {
    return [];
  }
}
