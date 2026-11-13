import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";

// Estas APIs responden en uno o dos segundos: si tardan más de 30 están colgadas,
// y sin timeout frenarían todo el refresco antes de pasar al scraper de fallback.
const TIMEOUT_API_MS = 30_000;

// Un 5xx o un corte de red suelen ser pasajeros (la API de Cinemark devuelve 500
// de a ratos), así que se reintenta antes de pasar al scraper. Un 4xx o un
// timeout no se reintentan: el primero no cambia solo y el segundo ya esperó 30 s.
const REINTENTOS = 2;
const ESPERA_ENTRE_INTENTOS_MS = 3_000;

class ErrorTransitorio extends Error {}

export class CineApiRequester<T> {
  constructor(
    private readonly cine: Cine,
    private readonly mapper: (data: T, cine: Cine) => PeliculaInput[],
    private readonly timeoutMs: number = TIMEOUT_API_MS,
    private readonly esperaEntreIntentosMs: number = ESPERA_ENTRE_INTENTOS_MS,
  ) {}

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    for (let intento = 0; ; intento++) {
      try {
        const responseJson = await this.consultar();
        return this.mapper(responseJson, this.cine);
      } catch (error) {
        if (!(error instanceof ErrorTransitorio) || intento >= REINTENTOS) {
          throw error;
        }
        console.warn(
          `⚠️ API de ${this.cine.nombre}: ${error.message}. Reintento ${intento + 1} de ${REINTENTOS}...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.esperaEntreIntentosMs),
        );
      }
    }
  }

  private async consultar(): Promise<T> {
    let response: Response;
    try {
      // El signal corta tanto la conexión como la lectura del body
      response = await fetch(this.cine.api_url!, {
        ...(this.cine.api_headers && { headers: this.cine.api_headers }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (esTimeout(error)) throw this.errorDeTimeout();
      // fetch rechaza ante un corte de red o de DNS
      throw new ErrorTransitorio(
        `Error de red al consultar ${this.cine.api_url}: ${error instanceof Error ? error.message : error}`,
      );
    }

    if (!response.ok) {
      const mensaje = `HTTP ${response.status} al consultar ${this.cine.api_url}`;
      throw response.status >= 500
        ? new ErrorTransitorio(mensaje)
        : new Error(mensaje);
    }

    try {
      return await response.json();
    } catch (error) {
      if (esTimeout(error)) throw this.errorDeTimeout();
      throw error;
    }
  }

  private errorDeTimeout(): Error {
    return new Error(
      `Timeout de ${this.timeoutMs / 1000}s al consultar ${this.cine.api_url}`,
    );
  }
}

function esTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}
