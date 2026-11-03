import { describe, it, expect } from "vitest";
import { ordenarPorProximaFuncion } from "../src/repositories/carteleraRepository.js";

const jueves = new Date("2026-11-05T21:00:00-03:00");
const viernes = new Date("2026-11-06T18:00:00-03:00");

describe("ordenarPorProximaFuncion", () => {
  it("ordena por la función más cercana", () => {
    expect(
      ordenarPorProximaFuncion([
        { id: 1, popularidad: 90, proximaFuncion: viernes },
        { id: 2, popularidad: 10, proximaFuncion: jueves },
      ]),
    ).toEqual([2, 1]);
  });

  it("deja al final las películas sin funciones, ordenadas por popularidad", () => {
    expect(
      ordenarPorProximaFuncion([
        { id: 1, popularidad: 5, proximaFuncion: null },
        { id: 2, popularidad: 1, proximaFuncion: viernes },
        { id: 3, popularidad: 50, proximaFuncion: null },
      ]),
    ).toEqual([2, 3, 1]);
  });

  it("desempata por popularidad cuando la función es a la misma hora", () => {
    expect(
      ordenarPorProximaFuncion([
        { id: 1, popularidad: 3, proximaFuncion: jueves },
        { id: 2, popularidad: null, proximaFuncion: new Date(jueves) },
        { id: 3, popularidad: 8, proximaFuncion: new Date(jueves) },
      ]),
    ).toEqual([3, 1, 2]);
  });
});
