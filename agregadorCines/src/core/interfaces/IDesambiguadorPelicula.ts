import type { PeliculaInput } from "../dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../dtos/candidatoPelicula.js";

export interface IDesambiguadorPelicula {
  desempatar(
    peliculaInput: PeliculaInput,
    candidatos: CandidatoPelicula[],
  ): Promise<CandidatoPelicula | null>;
}
