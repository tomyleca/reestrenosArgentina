import { describe, it, expect } from "vitest";
import { NormalizadorFechas } from "../src/utils/normalizadorFechas.js";

describe("NormalizadorFechas", () => {
  const fechaHoy = new Date(2026, 2, 6); // Viernes 6 de Marzo 2026

  it("debería normalizar 'hoy'", () => {
    const resultado = NormalizadorFechas.normalizar("Hoy", fechaHoy);
    expect(resultado?.getDate()).toBe(6);
    expect(resultado?.getMonth()).toBe(2);
  });

  it("debería normalizar 'mañana'", () => {
    const resultado = NormalizadorFechas.normalizar("Mañana", fechaHoy);
    expect(resultado?.getDate()).toBe(7);
    expect(resultado?.getMonth()).toBe(2);
  });

  it("debería normalizar 'jueves 5' como el día anterior (si estamos a 6)", () => {
    const resultado = NormalizadorFechas.normalizar("jueves 5", fechaHoy);
    expect(resultado?.getDate()).toBe(5);
    expect(resultado?.getMonth()).toBe(2);
    expect(resultado?.getDay()).toBe(4); // Jueves
  });

  it("debería normalizar 'sábado 7' como el día siguiente", () => {
    const resultado = NormalizadorFechas.normalizar("sábado 7", fechaHoy);
    expect(resultado?.getDate()).toBe(7);
    expect(resultado?.getMonth()).toBe(2);
    expect(resultado?.getDay()).toBe(6); // Sábado
  });

  it("debería devolver null si solo hay un número sin día de la semana ni mes", () => {
    const resultado = NormalizadorFechas.normalizar("5", fechaHoy);
    expect(resultado).toBeNull();
  });

  it("debería normalizar una fecha con mes '20 de diciembre'", () => {
    const resultado = NormalizadorFechas.normalizar(
      "20 de diciembre",
      fechaHoy,
    );
    expect(resultado?.getDate()).toBe(20);
    expect(resultado?.getMonth()).toBe(11); // Diciembre (0-indexed)
  });

  it("debería saltar al siguiente año si estamos en Diciembre y la fecha es Enero", () => {
    const resultado = NormalizadorFechas.normalizar(
      "5 de enero",
      new Date(2026, 11, 1),
    ); // Diciembre 2026 -> Enero 2027
    expect(resultado?.getFullYear()).toBe(2027);
  });

  it("NO debería saltar al siguiente año si no estamos en Oct/Nov/Dic", () => {
    // Si estamos en Mayo y dice "10 de Enero", debería quedarse en 2026 (mes < mesRef pero no es fin de año)
    const resultado = NormalizadorFechas.normalizar(
      "10 de enero",
      new Date(2026, 4, 1),
    ); // Mayo 2026
    expect(resultado?.getFullYear()).toBe(2026);
  });

  it("debería manejar formatos con basura", () => {
    const resultado = NormalizadorFechas.normalizar(
      "  PRÓXIMO viernes 6 !!! ",
      fechaHoy,
    );
    expect(resultado?.getDate()).toBe(6);
    expect(resultado?.getDay()).toBe(5); // Viernes
  });
});
