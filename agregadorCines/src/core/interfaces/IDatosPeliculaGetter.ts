import type { Pelicula } from "../domain/pelicula.js";
import type { PeliculaInput } from "../dtos/peliculaInput.js";

export interface IDatosPeliculaGetter {
  getPeliculasFromScrapeado(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]>;
  getPeliculaFromScrapeado(peliculaInput: PeliculaInput): Promise<Pelicula>;
}
