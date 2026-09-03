import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import type { ICineApiRequester } from "../apiWithFallbackProvider.js";
import { CineApiRequester } from "../cineApiRequester.js";
import {
  ceaApiMapper,
  type CeaApiResponse,
} from "../mappers/ceaMapper.js";

export class CeaApiRequester implements ICineApiRequester {
  private readonly requester: CineApiRequester<CeaApiResponse>;

  constructor(public cine: Cine) {
    this.requester = new CineApiRequester(cine, ceaApiMapper);
  }

  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    return this.requester.obtenerPeliculas();
  }
}
