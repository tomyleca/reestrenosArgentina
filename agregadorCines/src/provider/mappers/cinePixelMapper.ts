import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

interface CinePixelApiItem {
  nombre: string;
}

interface CinePixelApiResponse {
  status: string;
  data: CinePixelApiItem[];
}

export function cinePixelApiMapper(
  responseJson: CinePixelApiResponse,
  cine: Cine,
): PeliculaInput[] {
  return responseJson.data.map((item) => ({
    titulo: item.nombre,
    cine,
  }));
}
