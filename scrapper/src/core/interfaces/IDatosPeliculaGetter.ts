import type { Pelicula } from "../domain/pelicula.js";
import type { PeliculaInput } from "../dtos/peliculaInput.js";

export interface IDatosPeliculaGetter {
  getPeliculaFromScrapeado(peliculasInput: PeliculaInput[]): Pelicula[];
}
