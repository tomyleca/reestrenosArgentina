import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { cinepolis } from "../../src/config/cinesConfig.js";
import { cinepolisGraphqlMapper } from "../../src/provider/mappers/cinepolisMapper.js";

const CINEPOLIS_CINE: Cine = { ...cinepolis, id: 2 };

// Forma de la respuesta de v2/billboards/graphql, reducida a lo que usa el mapper
function respuesta(nodes: Array<Record<string, unknown> | null>) {
  return { data: { movies: { edges: nodes.map((node) => ({ node })) } } };
}

describe("cinepolisGraphqlMapper (unitario)", () => {
  test("mapea el nombre de cada película, o el original si no hay", () => {
    const peliculas = cinepolisGraphqlMapper(
      respuesta([{ name: "Ebenezer" }, { originalName: "Clayface" }]),
      CINEPOLIS_CINE,
    );

    expect(peliculas).toEqual([
      { titulo: "Ebenezer", cine: CINEPOLIS_CINE },
      { titulo: "Clayface", cine: CINEPOLIS_CINE },
    ]);
  });

  test("no usa releaseDate como fecha de lanzamiento", () => {
    // releaseDate es el estreno en Cinépolis: en un reestreno es del año actual
    const [pelicula] = cinepolisGraphqlMapper(
      respuesta([{ name: "Rocky", releaseDate: "2026-11-12" }]),
      CINEPOLIS_CINE,
    );

    expect(pelicula?.fechaLanzamiento).toBeUndefined();
  });

  test("descarta películas sin título y respuestas sin cartelera", () => {
    expect(
      cinepolisGraphqlMapper(respuesta([{ name: "" }, null]), CINEPOLIS_CINE),
    ).toEqual([]);
    expect(cinepolisGraphqlMapper({ data: {} }, CINEPOLIS_CINE)).toEqual([]);
  });
});
