import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

// Mapper para la API REST legacy (ya no usada, conservada por compatibilidad)
interface CinepolisApiResponse {
  data: { title_translated: string; release_date: string }[];
}

export function cinepolisApiMapper(
  responseJson: CinepolisApiResponse,
  cine: Cine,
): PeliculaInput[] {
  return responseJson.data.map((item) => ({
    titulo: item.title_translated,
    cine,
  }));
}

// Mapper para la API GraphQL nueva (api-g.cinepolis.com, post-migración Next.js).
// La respuesta GraphQL puede tener diferentes shapes según qué query se intercepte.
// Este mapper maneja de forma defensiva las estructuras más comunes.
interface CinepolisGraphqlResponse {
  data?: Record<string, unknown>;
  errors?: unknown[];
}

function extraerPeliculasDeGraphql(data: Record<string, unknown>): Array<{ titulo: string; fechaLanzamiento?: Date }> {
  // Recorremos recursivamente buscando arrays con campos de película
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0] as Record<string, unknown>;
      if (first && (first.title || first.name || first.movieTitle || first.titulo)) {
        return value.map((item: Record<string, unknown>) => {
          const rawDate = item.releaseDate || item.release_date;
          const result: { titulo: string; fechaLanzamiento?: Date } = {
            titulo: String(item.title || item.name || item.movieTitle || item.titulo || "Sin título"),
          };
          if (rawDate) result.fechaLanzamiento = new Date(String(rawDate));
          return result;
        });
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = extraerPeliculasDeGraphql(value as Record<string, unknown>);
      if (nested.length > 0) return nested;
    }
  }
  return [];
}

export function cinepolisGraphqlMapper(
  responseJson: any,
  cine: Cine,
): PeliculaInput[] {
  if (!responseJson?.data?.movies?.edges) return [];
  
  return responseJson.data.movies.edges.map((edge: any) => {
    const node = edge?.node;
    const result: PeliculaInput = {
      titulo: node?.name || node?.originalName || "Sin título",
      cine,
    };
    if (node?.releaseDate) {
      result.fechaLanzamiento = new Date(node.releaseDate);
    }
    return result;
  });
}

