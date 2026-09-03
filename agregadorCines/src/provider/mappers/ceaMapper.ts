import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

export interface CeaApiPelicula {
  id: number | string;
  titulo?: string;
  tituloPlano?: string;
  director?: string;
  anio?: number | string;
  formato?: string;
  badge2?: string;
  dia?: string | number;
  diaSemana?: string;
  diaSemanaCorto?: string;
  mes?: string;
  hora?: string;
  posterBase?: string;
  formUrl?: string;
}

export interface CeaApiResponse {
  ciclo?: string;
  resumen?: string;
  rangoFechas?: string;
  peliculas?: CeaApiPelicula[];
}

function cleanHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ceaApiMapper(
  data: CeaApiResponse,
  cine: Cine,
): PeliculaInput[] {
  if (!data || !Array.isArray(data.peliculas)) {
    return [];
  }

  const seenTitles = new Set<string>();
  const peliculas: PeliculaInput[] = [];

  for (const peli of data.peliculas) {
    if (!peli) continue;

    const rawTitle = peli.tituloPlano || peli.titulo || "";
    const titulo = cleanHtml(rawTitle);

    if (!titulo || seenTitles.has(titulo.toLowerCase())) {
      continue;
    }
    seenTitles.add(titulo.toLowerCase());

    const anioNumero =
      typeof peli.anio === "number"
        ? peli.anio
        : peli.anio
          ? parseInt(String(peli.anio), 10) || undefined
          : undefined;

    let fecha: string | undefined;
    if (peli.dia && peli.mes) {
      fecha = `${peli.dia} de ${peli.mes}`;
    }

    const pelicula: PeliculaInput = {
      titulo,
      cine,
      ...(peli.director ? { director: peli.director.trim() } : {}),
      ...(anioNumero ? { anioLanzamiento: anioNumero } : {}),
      ...(data.ciclo ? { ciclo: cleanHtml(data.ciclo) } : {}),
      ...(fecha ? { fecha } : {}),
    };

    peliculas.push(pelicula);
  }

  return peliculas;
}
