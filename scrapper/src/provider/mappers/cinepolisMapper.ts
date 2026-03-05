import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

interface CinepolisApiResponse {
  data: { title_translated: string, release_date: string }[];
}

export function cinepolisApiMapper(
  responseJson: CinepolisApiResponse,
  cine: Cine,
): PeliculaInput[] {
  return responseJson.data.map((item) => ({
    titulo: item.title_translated,
	fechaLanzamiento: new Date(item.release_date),
    cine,
  }));
}
