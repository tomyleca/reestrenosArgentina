import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import type { ICineApiRequester } from "../apiWithFallbackProvider.js";
import { CineApiRequester } from "../cineApiRequester.js";
import {
  peliculasPorComplejoMapper,
  type PeliculaPorComplejoItem,
} from "../mappers/peliculasPorComplejoMapper.js";

// Atlas se muestra como un solo cine, pero la API devuelve la cartelera de a
// un complejo. Códigos tomados de las pestañas de complejo de atlascines.com.
export const COMPLEJOS_ATLAS: Record<number, string> = {
  194: "Alcorta",
  191: "Caballito",
  192: "Catán",
  197: "Flores",
  198: "Liniers",
  196: "Nordelta",
  195: "Patio Bullrich",
};

const CICLOS_ATLAS = {
  "BARS:": "BARS - Buenos Aires Rojo Sangre (festival de cine de terror)",
};

type CrearRequester = (
  cine: Cine,
) => Pick<CineApiRequester<PeliculaPorComplejoItem[]>, "obtenerPeliculas">;

export class AtlasApiRequester implements ICineApiRequester {
  constructor(
    public cine: Cine,
    // Inyectable para los tests
    private readonly crearRequester: CrearRequester = (cineComplejo) =>
      new CineApiRequester<PeliculaPorComplejoItem[]>(cineComplejo, (data, c) =>
        peliculasPorComplejoMapper(data, c, { ciclosPorPrefijo: CICLOS_ATLAS }),
      ),
  ) {}

  // Si un complejo falla se tira el error y el provider pasa al scraper: con
  // una cartelera parcial, las películas de ese complejo saldrían de cartelera.
  async obtenerPeliculas(): Promise<PeliculaInput[]> {
    const porComplejo = await Promise.all(
      Object.keys(COMPLEJOS_ATLAS).map((codigo) => {
        const url = new URL(this.cine.api_url!);
        url.searchParams.set("codComplejo", codigo);
        return this.crearRequester({ ...this.cine, api_url: url.toString() })
          .obtenerPeliculas();
      }),
    );

    // La misma película se pasa en varios complejos: para el cine es una sola
    const vistos = new Set<string>();
    return porComplejo.flat().filter((p) => {
      const clave = p.titulo.toLowerCase();
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
  }
}
