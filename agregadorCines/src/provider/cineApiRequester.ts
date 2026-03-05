import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";

export class CineApiRequester<T> {
  constructor(
    private readonly cine: Cine,
    private readonly mapper: (data: T, cine: Cine) => PeliculaInput[],
  ) {}

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    const response = await fetch(this.cine.api_url!);
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} al consultar ${this.cine.api_url}`,
      );
    }
    const responseJson: T = await response.json();
    return this.mapper(responseJson, this.cine);
  }
}
