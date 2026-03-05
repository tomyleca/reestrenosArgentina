import type { Cine } from "../domain/cine.js";

export interface PeliculaInput {
  titulo: string;
  idiomas?: string[];
  cine: Cine;
  fechaLanzamiento?: Date;
}
