import type { IDesambiguadorPelicula } from "../../core/interfaces/IDesambiguadorPelicula.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../../core/dtos/candidatoPelicula.js";
import { tmdbLogger } from "../tmdbLogger.js";

const CUATRO_MESES_MS = 4 * 30 * 24 * 60 * 60 * 1000;
const CUATRO_MESES_DIAS = 4 * 30;
const MARGEN_FECHA = CUATRO_MESES_MS;
const MIN_SIMILARITY_SCORE = 0.1;

export class DesambiguadorHeuristico implements IDesambiguadorPelicula {
  async desempatar(
    peliculaInput: PeliculaInput,
    candidatos: CandidatoPelicula[],
  ): Promise<CandidatoPelicula | null> {
    if (!candidatos || candidatos.length === 0) return null;

    // 1. Filtro por umbral mínimo de similitud
    const candidatosValidos = candidatos.filter(
      (p) => p.score >= MIN_SIMILARITY_SCORE,
    );

    tmdbLogger.candidatosValidos(
      candidatosValidos.length,
      candidatos.length,
      MIN_SIMILARITY_SCORE,
    );

    if (candidatosValidos.length === 0) {
      tmdbLogger.sinCandidatosValidos(peliculaInput.titulo);
      console.warn(
        `⚠️ No se encontró una coincidencia con similitud suficiente para: "${peliculaInput.titulo}"`,
      );
      return null;
    }

    // 2. Filtro por fecha específica si el scraper provee fechaLanzamiento
    const fechaLanzamiento = peliculaInput.fechaLanzamiento;
    const candidatosPorFecha = fechaLanzamiento
      ? this.filtrarPorFecha(candidatosValidos, fechaLanzamiento)
      : candidatosValidos;

    if (fechaLanzamiento) {
      tmdbLogger.filtroPorFecha(
        candidatosPorFecha.length,
        candidatosValidos.length,
        CUATRO_MESES_DIAS,
      );
    }

    // 3. Pool definitivo de candidatos a ordenar
    const pool =
      candidatosPorFecha.length > 0 ? candidatosPorFecha : candidatosValidos;

    const ahora = Date.now();
    const candidatosOrdenados = [...pool].sort((a, b) => {
      // Si la diferencia de score de similitud es grande (> 0.15), gana el de mayor score
      if (Math.abs(b.score - a.score) > 0.15) {
        tmdbLogger.comparacion(
          a as any,
          b as any,
          "score",
          b.score > a.score ? b.title : a.title,
        );
        return b.score - a.score;
      }

      // Si el score es cercano, evaluamos si la fecha de lanzamiento mundial de TMDB es reciente
      const cercanoA = a.release_date
        ? Math.abs(new Date(a.release_date).getTime() - ahora) <= MARGEN_FECHA
        : false;
      const cercanoB = b.release_date
        ? Math.abs(new Date(b.release_date).getTime() - ahora) <= MARGEN_FECHA
        : false;

      if (cercanoA !== cercanoB) {
        const ganadorFecha = cercanoA ? a.title : b.title;
        tmdbLogger.comparacion(a as any, b as any, "fecha", ganadorFecha);
        return cercanoA ? -1 : 1;
      }

      // En caso de empate, desempato por popularidad
      const popA = a.popularity ?? 0;
      const popB = b.popularity ?? 0;
      tmdbLogger.comparacion(
        a as any,
        b as any,
        "popularidad",
        popB > popA ? b.title : a.title,
      );
      return popB - popA;
    });

    const ganador = candidatosOrdenados[0] ?? null;
    if (ganador) {
      tmdbLogger.ganador(ganador as any);
    }

    return ganador;
  }

  private filtrarPorFecha(
    resultados: CandidatoPelicula[],
    fechaLanzamiento: Date,
  ): CandidatoPelicula[] {
    return resultados.filter((p) => {
      if (!p.release_date) return false;
      const diff = Math.abs(
        new Date(p.release_date).getTime() - fechaLanzamiento.getTime(),
      );
      return diff <= MARGEN_FECHA;
    });
  }
}
