import type { IDesambiguadorPelicula } from "../../core/interfaces/IDesambiguadorPelicula.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../../core/dtos/candidatoPelicula.js";
import { DesambiguadorHeuristico } from "./desambiguadorHeuristico.js";
import { DesambiguadorIA } from "./desambiguadorIA.js";

const MIN_SIMILARITY_SCORE = 0.1;
const MAX_CANDIDATOS_IA = 8;

/**
 * DesambiguadorHibrido
 *
 * Estrategia de selección híbrida que combina:
 *   1. Fast-Path heurístico para coincidencias de alta certeza.
 *   2. Desambiguación con Gemini AI cuando existen metadatos contextuales (ciclo, director, texto raw) o ambigüedad.
 *   3. Fallback automático al desambiguador heurístico si la IA no retorna respuesta.
 */
export class DesambiguadorHibrido implements IDesambiguadorPelicula {
  private heuristico: IDesambiguadorPelicula;
  private ia: IDesambiguadorPelicula;

  constructor(
    heuristico?: IDesambiguadorPelicula,
    ia?: IDesambiguadorPelicula,
  ) {
    this.heuristico = heuristico || new DesambiguadorHeuristico();
    this.ia = ia || new DesambiguadorIA();
  }

  async desempatar(
    peliculaInput: PeliculaInput,
    candidatos: CandidatoPelicula[],
  ): Promise<CandidatoPelicula | null> {
    if (!candidatos || candidatos.length === 0) return null;

    // 1. Filtrar candidatos por umbral mínimo y ordenarlos descendentemente por score de similitud
    const candidatosValidos = candidatos
      .filter((c) => c.score >= MIN_SIMILARITY_SCORE)
      .sort((a, b) => b.score - a.score);

    if (candidatosValidos.length === 0) return null;

    // 2. Coincidencia unívoca (Fast Path). Solo se cumple si hay un solo candidato con >0.95 de score
    // y no hay contexto especifico que pueda usar la IA para terminar de comprobar.
    const tieneContextoEspecifico = Boolean(
      peliculaInput.ciclo || peliculaInput.director || peliculaInput.textoRaw,
    );

    const primerCandidato = candidatosValidos[0];
    if (
      candidatosValidos.length === 1 &&
      primerCandidato &&
      primerCandidato.score >= 0.95 &&
      !tieneContextoEspecifico
    ) {
      return primerCandidato;
    }

    // 3. Evaluamos si corresponde invocar la IA
    const candidatosIA = candidatosValidos.slice(0, MAX_CANDIDATOS_IA);

    //Si hay contexto especifico, usamos la IA para desempatar.
    //Si no hay contexto especifico, usamos el desambiguador heuristico.
    if (tieneContextoEspecifico) {
      const resultadoIA = await this.ia.desempatar(peliculaInput, candidatosIA);
      if (resultadoIA) {
        return resultadoIA;
      }
    }

    // 4. Fallback al desambiguador heurístico
    return this.heuristico.desempatar(peliculaInput, candidatosValidos);
  }
}
