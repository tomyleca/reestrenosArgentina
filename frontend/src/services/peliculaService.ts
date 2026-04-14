import type { Pelicula, Cine } from "@/types/pelicula";
import type { GetPeliculasParams, PaginatedResult } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── helpers ────────────────────────────────────────────────────────────────

function toSearchParams<T extends object>(params: T): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }
  return query;
}

async function get<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    url.search = params.toString();
  }

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(
      `Error ${res.status} al obtener ${path}: ${await res.text()}`,
    );
  }

  return res.json() as Promise<T>;
}

// ─── service ─────────────────────────────────────────────────────────────────

export const peliculaService = {
  /** GET /peliculas/estrenos */
  getEstrenosPaginados(
    params: GetPeliculasParams = {},
  ): Promise<PaginatedResult<Pelicula>> {
    return get<PaginatedResult<Pelicula>>(
      "/peliculas/estrenos",
      toSearchParams(params),
    );
  },

  /** GET /peliculas/reestrenos */
  getReestrenosPaginados(
    params: GetPeliculasParams = {},
  ): Promise<PaginatedResult<Pelicula>> {
    return get<PaginatedResult<Pelicula>>(
      "/peliculas/reestrenos",
      toSearchParams(params),
    );
  },

  /** GET /peliculas/:id */
  getPeliculaById(id: number): Promise<Pelicula> {
    return get<Pelicula>(`/peliculas/${id}`);
  },

  /** GET /cines */
  getCines(): Promise<Cine[]> {
    return get<Cine[]>("/cines");
  },
};
