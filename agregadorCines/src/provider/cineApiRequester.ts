import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";

// Estas APIs responden en uno o dos segundos: si tardan más de 30 están colgadas,
// y sin timeout frenarían todo el refresco antes de pasar al scraper de fallback.
const TIMEOUT_API_MS = 30_000;

export class CineApiRequester<T> {
  constructor(
    private readonly cine: Cine,
    private readonly mapper: (data: T, cine: Cine) => PeliculaInput[],
    private readonly timeoutMs: number = TIMEOUT_API_MS,
  ) {}

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    let response: Response;
    let responseJson: T;
    try {
      // El signal corta tanto la conexión como la lectura del body
      response = await fetch(this.cine.api_url!, {
        ...(this.cine.api_headers && { headers: this.cine.api_headers }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} al consultar ${this.cine.api_url}`,
        );
      }
      responseJson = await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(
          `Timeout de ${this.timeoutMs / 1000}s al consultar ${this.cine.api_url}`,
        );
      }
      throw error;
    }
    return this.mapper(responseJson, this.cine);
  }
}
