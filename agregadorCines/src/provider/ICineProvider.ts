import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";

export interface ICineProvider {
  cine: Cine;
  obtenerPeliculas(): Promise<PeliculaInput[]>;
}
