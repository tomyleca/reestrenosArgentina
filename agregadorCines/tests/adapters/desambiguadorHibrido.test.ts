import { describe, test, expect, vi } from "vitest";
import { DesambiguadorHibrido } from "../../src/adapters/desambiguadores/desambiguadorHibrido.js";
import type { IDesambiguadorPelicula } from "../../src/core/interfaces/IDesambiguadorPelicula.js";
import type { PeliculaInput } from "../../src/core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../../src/core/dtos/candidatoPelicula.js";

describe("DesambiguadorHibrido", () => {
  const cineMock = { id: 1, nombre: "Cine Malba", localidad: "CABA" as const, url: "" };
  const candidatoMock: CandidatoPelicula = {
    id: 99,
    title: "Test Movie",
    original_title: "Test Movie",
    score: 0.9,
  };

  test("usa el desambiguador heurístico directamente cuando no hay contexto rico ni múltiples candidatos", async () => {
    const heuristicoMock: IDesambiguadorPelicula = {
      desempatar: vi.fn().mockResolvedValue(candidatoMock),
    };
    const iaMock: IDesambiguadorPelicula = {
      desempatar: vi.fn().mockResolvedValue(null),
    };

    const hibrido = new DesambiguadorHibrido(heuristicoMock, iaMock);
    const inputSimple: PeliculaInput = { titulo: "Movie Simple", cine: cineMock };

    const resultado = await hibrido.desempatar(inputSimple, [candidatoMock]);

    expect(resultado?.id).toBe(99);
    expect(iaMock.desempatar).not.toHaveBeenCalled();
    expect(heuristicoMock.desempatar).toHaveBeenCalled();
  });

  test("invoca a la IA cuando hay contexto rico (ej: ciclo)", async () => {
    const heuristicoMock: IDesambiguadorPelicula = {
      desempatar: vi.fn().mockResolvedValue(null),
    };
    const iaMock: IDesambiguadorPelicula = {
      desempatar: vi.fn().mockResolvedValue(candidatoMock),
    };

    const hibrido = new DesambiguadorHibrido(heuristicoMock, iaMock);
    const inputRico: PeliculaInput = {
      titulo: "El Padrino",
      cine: cineMock,
      ciclo: "Trilogías Icónicas",
    };

    const resultado = await hibrido.desempatar(inputRico, [candidatoMock]);

    expect(resultado?.id).toBe(99);
    expect(iaMock.desempatar).toHaveBeenCalled();
    expect(heuristicoMock.desempatar).not.toHaveBeenCalled();
  });

  test("hace fallback al heurístico si la IA devuelve null", async () => {
    const heuristicoMock: IDesambiguadorPelicula = {
      desempatar: vi.fn().mockResolvedValue(candidatoMock),
    };
    const iaMock: IDesambiguadorPelicula = {
      desempatar: vi.fn().mockResolvedValue(null),
    };

    const hibrido = new DesambiguadorHibrido(heuristicoMock, iaMock);
    const inputRico: PeliculaInput = {
      titulo: "El Padrino",
      cine: cineMock,
      director: "Coppola",
    };

    const resultado = await hibrido.desempatar(inputRico, [candidatoMock]);

    expect(resultado?.id).toBe(99);
    expect(iaMock.desempatar).toHaveBeenCalled();
    expect(heuristicoMock.desempatar).toHaveBeenCalled();
  });
});
