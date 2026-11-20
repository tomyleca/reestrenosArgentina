import { describe, test, expect, vi } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import type { PeliculaInput } from "../../src/core/dtos/peliculaInput.js";
import { cineAtlas } from "../../src/config/cinesConfig.js";
import {
  AtlasApiRequester,
  COMPLEJOS_ATLAS,
} from "../../src/provider/apiRequesters/atlasApiRequester.js";

const ATLAS: Cine = { ...cineAtlas, id: 10 };

// Requester falso por complejo: devuelve las películas según el codComplejo de la URL
function requesterPorComplejo(peliculasPorCodigo: Record<string, string[]>) {
  const urls: string[] = [];
  const crear = vi.fn((cine: Cine) => ({
    obtenerPeliculas: async (): Promise<PeliculaInput[]> => {
      urls.push(cine.api_url!);
      const codigo = new URL(cine.api_url!).searchParams.get("codComplejo")!;
      if (peliculasPorCodigo[codigo] === undefined) throw new Error(`HTTP 500 (${codigo})`);
      return peliculasPorCodigo[codigo].map((titulo) => ({ titulo, cine }));
    },
  }));
  return { crear, urls };
}

const todosVacios = Object.fromEntries(
  Object.keys(COMPLEJOS_ATLAS).map((c) => [c, [] as string[]]),
);

describe("AtlasApiRequester", () => {
  test("consulta todos los complejos y junta sus películas sin repetir", async () => {
    const { crear, urls } = requesterPorComplejo({
      ...todosVacios,
      191: ["ROCKY", "TERRIFIER 2"],
      196: ["Rocky", "CLAYFACE"],
    });

    const peliculas = await new AtlasApiRequester(ATLAS, crear).obtenerPeliculas();

    expect(peliculas.map((p) => p.titulo)).toEqual(["ROCKY", "TERRIFIER 2", "CLAYFACE"]);
    expect(urls).toHaveLength(Object.keys(COMPLEJOS_ATLAS).length);
    expect(urls).toContain(`${cineAtlas.api_url}?codComplejo=191`);
  });

  test("las películas quedan a nombre del cine Atlas", async () => {
    const { crear } = requesterPorComplejo({ ...todosVacios, 194: ["ROCKY"] });

    const [pelicula] = await new AtlasApiRequester(ATLAS, crear).obtenerPeliculas();

    expect(pelicula?.cine.id).toBe(ATLAS.id);
    expect(pelicula?.cine.nombre).toBe("Atlas");
  });

  test("si un complejo falla, falla todo para que corra el scraper", async () => {
    const { 198: _liniers, ...sinLiniers } = { ...todosVacios, 191: ["ROCKY"] };
    const { crear } = requesterPorComplejo(sinLiniers);

    await expect(new AtlasApiRequester(ATLAS, crear).obtenerPeliculas()).rejects.toThrow(
      "HTTP 500 (198)",
    );
  });
});
