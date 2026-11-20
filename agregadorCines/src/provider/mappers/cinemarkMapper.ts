import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

interface CinemarkApiResponse {
  data: { title: string }[];
}

// La API trae `openingDate`, pero es la fecha en que la película llega a
// Cinemark, no la de lanzamiento: en un reestreno ("ROCKY 50° ANIVERSARIO",
// openingDate 2026) llevaría a elegir una película del año equivocado. Como la
// API no tiene la fecha de lanzamiento, no se informa.
export function cinemarkApiMapper(
  responseObject: CinemarkApiResponse,
  cine: Cine,
): PeliculaInput[] {
  return responseObject.data.map((item) => ({
    titulo: item.title,
    cine,
  }));
}
