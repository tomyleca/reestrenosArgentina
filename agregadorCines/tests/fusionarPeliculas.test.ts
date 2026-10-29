import { describe, it, expect } from "vitest";
import { fusionarPeliculas, type Pelicula } from "../src/core/domain/pelicula.js";
import type { Cine } from "../src/core/domain/cine.js";

const malba: Cine = { id: 1, nombre: "Cine Malba", localidad: "CABA", url: "" };
const casaPBA: Cine = { id: 2, nombre: "Casa PBA", localidad: "CABA", url: "" };

function crearPelicula(
  tmdbId: number,
  cines: Cine[],
  fechas: Date[],
): Pelicula {
  return {
    id: tmdbId,
    titulo: `Pelicula ${tmdbId}`,
    descripcion: "",
    generos: [],
    duracionMinutos: 100,
    categoria: "REESTRENOS",
    cines,
    activa: true,
    tmdbId,
    funciones: fechas.map((fecha) => ({ fecha, cineId: cines[0]!.id })),
  };
}

describe("fusionarPeliculas", () => {
  const jueves = new Date(2026, 9, 29);
  const viernes = new Date(2026, 9, 30);

  it("debería unir cines y funciones de la misma película por tmdbId", () => {
    const resultado = fusionarPeliculas([
      crearPelicula(807, [malba], [jueves]),
      crearPelicula(807, [casaPBA], [viernes]),
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.cines.map((c) => c.id)).toEqual([1, 2]);
    expect(resultado[0]?.funciones?.map((f) => f.fecha.getTime())).toEqual([
      jueves.getTime(),
      viernes.getTime(),
    ]);
  });

  it("no debería duplicar cines ni fechas repetidas", () => {
    const resultado = fusionarPeliculas([
      crearPelicula(807, [malba], [jueves]),
      crearPelicula(807, [malba], [new Date(jueves)]),
    ]);

    expect(resultado[0]?.cines).toHaveLength(1);
    expect(resultado[0]?.funciones).toHaveLength(1);
  });

  it("debería conservar la función de cada cine aunque coincida la fecha", () => {
    const resultado = fusionarPeliculas([
      crearPelicula(807, [malba], [jueves]),
      crearPelicula(807, [casaPBA], [new Date(jueves)]),
    ]);

    expect(resultado[0]?.funciones?.map((f) => f.cineId)).toEqual([1, 2]);
  });

  it("debería mantener separadas películas distintas", () => {
    const resultado = fusionarPeliculas([
      crearPelicula(807, [malba], [jueves]),
      crearPelicula(238, [malba], [jueves]),
    ]);

    expect(resultado.map((p) => p.tmdbId)).toEqual([807, 238]);
  });

  it("no debería mutar los arrays de las películas de entrada", () => {
    const primera = crearPelicula(807, [malba], [jueves]);
    const segunda = crearPelicula(807, [casaPBA], [viernes]);

    fusionarPeliculas([primera, segunda]);

    expect(primera.cines).toHaveLength(1);
    expect(primera.funciones).toHaveLength(1);
  });
});
