import type { Cine } from "../domain/cine.js";

export interface PeliculaInput {
  titulo: string;
  idiomas?: string[];
  cine: Cine;
  fechaLanzamiento?: Date;
  anioLanzamiento?: number;
  fecha?: string | Date | null | undefined;
  ciclo?: string;
  director?: string;
  textoRaw?: string;
}

