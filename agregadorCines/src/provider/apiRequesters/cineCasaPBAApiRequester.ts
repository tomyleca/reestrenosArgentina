import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import type { ICineApiRequester } from "../apiWithFallbackProvider.js";

/**
 * CasaPBA no parece tener una API pública accesible de manera sencilla.
 * Se implementa este Requester como un mock para cumplir con la arquitectura
 * y permitir que el Scraper sea el proveedor principal de datos.
 */
export class CineCasaPBAApiRequester implements ICineApiRequester {
  constructor(public cine: Cine) {}

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    // Retornamos un array vacío ya que la fuente principal es el Scraper.
    return [];
  }
}
