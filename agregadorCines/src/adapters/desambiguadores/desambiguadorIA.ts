import axios from "axios";
import type { IDesambiguadorPelicula } from "../../core/interfaces/IDesambiguadorPelicula.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../../core/dtos/candidatoPelicula.js";
import { tmdbLogger } from "../tmdbLogger.js";

// Configuración de cuotas y modelo (fácilmente modificable)
const DEFAULT_MODEL_NAME = "gemini-3.5-flash-lite";
const REQUESTS_PER_MINUTE = 15; // 15 RPM (4000ms de pacing por llamada)
const MIN_INTERVAL_MS = Math.ceil(60000 / REQUESTS_PER_MINUTE);
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

export class DesambiguadorIA implements IDesambiguadorPelicula {
  private apiKey: string;
  private modelName: string;
  private static ultimasLlamadas: number = 0;

  constructor(
    apiKey?: string,
    modelName: string = DEFAULT_MODEL_NAME,
  ) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.modelName = modelName;
  }

  async desempatar(
    peliculaInput: PeliculaInput,
    candidatos: CandidatoPelicula[],
  ): Promise<CandidatoPelicula | null> {
    if (!candidatos || candidatos.length === 0) return null;
    if (!this.apiKey) {
      console.warn(
        "⚠️ GEMINI_API_KEY no está configurada. DesambiguadorIA no puede ejecutarse.",
      );
      return null;
    }

    tmdbLogger.invocacionIA(
      peliculaInput.titulo,
      peliculaInput.cine.nombre,
      candidatos.length,
    );

    const candidatosFormateados = candidatos
      .map(
        (c, idx) =>
          `${idx + 1}. ID: ${c.id} | Título: "${c.title}" | Título Original: "${c.original_title}" | Año Estreno: ${
            c.release_date ? c.release_date.substring(0, 4) : "Desconocido"
          } | Sinopsis: "${c.overview ? c.overview.substring(0, 200) : "N/A"}"`,
      )
      .join("\n");

    const prompt = `Eres un experto en cine y cartelera cinematográfica (especialmente reestrenos, ciclos de cine y retrospectivas en Argentina).
Tu objetivo es identificar cuál candidato de la lista corresponde verdaderamente a la película promocionada por el cine.

Datos de la película en el cine:
- Título en cartelera: "${peliculaInput.titulo}"
- Cine: "${peliculaInput.cine.nombre}"
- Ciclo: "${peliculaInput.ciclo ?? "No especificado"}"
- Director: "${peliculaInput.director ?? "No especificado"}"
- Año estimado: "${peliculaInput.anioLanzamiento ?? "No especificado"}"
- Texto adicional: "${peliculaInput.textoRaw ?? "No especificado"}"

Candidatos disponibles:
${candidatosFormateados}

Responde exclusivamente en formato JSON válido con la siguiente estructura exacta:
{
  "selected_id": number | null,
  "reasoning": "Explicación breve de por qué se eligió o descartó"
}`;

    return this.ejecutarConReintento(peliculaInput, prompt, candidatos, 0);
  }

  private async esperarPacing(): Promise<void> {
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - DesambiguadorIA.ultimasLlamadas;
    if (tiempoTranscurrido < MIN_INTERVAL_MS) {
      const tiempoEspera = MIN_INTERVAL_MS - tiempoTranscurrido;
      await new Promise((resolve) => setTimeout(resolve, tiempoEspera));
    }
    DesambiguadorIA.ultimasLlamadas = Date.now();
  }

  private async ejecutarConReintento(
    peliculaInput: PeliculaInput,
    prompt: string,
    candidatos: CandidatoPelicula[],
    intento: number,
  ): Promise<CandidatoPelicula | null> {
    try {
      await this.esperarPacing();

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const jsonText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) return null;

      const parsed = JSON.parse(jsonText);
      const selectedId = parsed?.selected_id;

      if (selectedId === null || selectedId === undefined) {
        tmdbLogger.sinGanadorIA(peliculaInput.titulo, parsed?.reasoning ?? "");
        return null;
      }

      const candidatoElegido = candidatos.find((c) => c.id === selectedId);
      if (candidatoElegido) {
        tmdbLogger.ganadorIA(
          peliculaInput.titulo,
          candidatoElegido,
          parsed?.reasoning ?? "",
        );
        return candidatoElegido;
      }

      return null;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 429 &&
        intento < MAX_RETRIES
      ) {
        console.warn(
          `⚠️ Rate limit 429 en ${this.modelName} para "${peliculaInput.titulo}". Reintentando en ${RETRY_DELAY_MS / 1000}s (intento ${intento + 1}/${MAX_RETRIES})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.ejecutarConReintento(
          peliculaInput,
          prompt,
          candidatos,
          intento + 1,
        );
      }

      tmdbLogger.errorIA(peliculaInput.titulo, error);
      return null;
    }
  }
}
