import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";

// Respuesta de /Funciones/GetPeliculasPorComplejo: una entrada por película en
// cartelera (con su próxima función) y los datos de la película en cachePeliculas.
export interface CinePixelApiItem {
  cachePeliculas?: {
    titulo?: string | null;
    tituloOriginal?: string | null;
  } | null;
}

export function cinePixelApiMapper(
  responseJson: CinePixelApiItem[],
  cine: Cine,
): PeliculaInput[] {
  // Si la API cambia de formato se devuelve vacío: el provider pasa al scraper
  if (!Array.isArray(responseJson)) return [];

  const vistos = new Set<string>();
  const peliculas: PeliculaInput[] = [];

  for (const item of responseJson) {
    const titulo = item?.cachePeliculas?.titulo?.trim();
    if (!titulo) continue;

    const clave = titulo.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    // El título original es contexto para el desambiguador cuando el título
    // local es ambiguo (ej. "ANIQUILACION" es "Onslaught", no "Annihilation").
    // No se usa `estreno`: es la fecha en que la película llegó a este cine, y
    // en un reestreno apuntaría al año equivocado.
    const tituloOriginal = item.cachePeliculas?.tituloOriginal?.trim();
    const aportaContexto =
      tituloOriginal && tituloOriginal.toLowerCase() !== clave;

    peliculas.push({
      titulo,
      cine,
      ...(aportaContexto
        ? { textoRaw: `Título original: ${tituloOriginal}` }
        : {}),
    });
  }

  return peliculas;
}
