import { describe, test, expect } from "vitest";
import { DesambiguadorHeuristico } from "../../src/adapters/desambiguadores/desambiguadorHeuristico.js";
import type { PeliculaInput } from "../../src/core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../../src/core/dtos/candidatoPelicula.js";

describe("DesambiguadorHeuristico", () => {
  const desambiguador = new DesambiguadorHeuristico();
  const cineMock = { id: 1, nombre: "Cine Test", localidad: "CABA" as const, url: "" };

  test("retorna null si la lista de candidatos está vacía", async () => {
    const peliculaInput: PeliculaInput = { titulo: "Batman", cine: cineMock };
    const resultado = await desambiguador.desempatar(peliculaInput, []);
    expect(resultado).toBeNull();
  });

  test("selecciona el candidato con score significativamente mayor", async () => {
    const peliculaInput: PeliculaInput = { titulo: "Alien", cine: cineMock };
    const candidatos: CandidatoPelicula[] = [
      { id: 1, title: "Alien, el octavo pasajero", original_title: "Alien", score: 0.9, popularity: 50 },
      { id: 2, title: "Aliens vs Predator", original_title: "AVP", score: 0.4, popularity: 100 },
    ];

    const resultado = await desambiguador.desempatar(peliculaInput, candidatos);
    expect(resultado?.id).toBe(1);
  });

  test("desempata por popularidad si los scores son cercanos y ninguno es fecha reciente", async () => {
    const peliculaInput: PeliculaInput = { titulo: "Solaris", cine: cineMock };
    const candidatos: CandidatoPelicula[] = [
      { id: 101, title: "Solaris", original_title: "Solaris", release_date: "1972-03-20", score: 1.0, popularity: 35.5 },
      { id: 102, title: "Solaris", original_title: "Solaris", release_date: "2002-11-27", score: 1.0, popularity: 18.2 },
    ];

    const resultado = await desambiguador.desempatar(peliculaInput, candidatos);
    expect(resultado?.id).toBe(101);
  });
});
