import { describe, it, expect } from "vitest";
import {
  calendarioArgentina,
  fechaArgentina,
  inicioDelDiaArgentina,
} from "../src/utils/fechasArgentina.js";
import { buildFuncionesFiltro } from "../src/repositories/carteleraRepository.js";

describe("fechasArgentina", () => {
  it("fechaArgentina arma el instante en UTC-3", () => {
    expect(fechaArgentina(2026, 9, 30).toISOString()).toBe(
      "2026-10-30T03:00:00.000Z",
    );
    expect(fechaArgentina(2026, 9, 30, 20, 30).toISOString()).toBe(
      "2026-10-30T23:30:00.000Z",
    );
  });

  it("fechaArgentina pasa de mes con días fuera de rango", () => {
    expect(fechaArgentina(2026, 9, 32)).toEqual(fechaArgentina(2026, 10, 1));
  });

  it("calendarioArgentina usa el día de Argentina y no el de UTC", () => {
    // 02:30 UTC del 31/10 = 23:30 del 30/10 en Argentina
    const instante = new Date("2026-10-31T02:30:00.000Z");
    expect(calendarioArgentina(instante)).toEqual({
      anio: 2026,
      mes: 9,
      dia: 30,
      diaSemana: 5, // Viernes
    });
  });

  it("inicioDelDiaArgentina devuelve las 00:00 de Argentina", () => {
    const instante = new Date("2026-10-31T02:30:00.000Z");
    expect(inicioDelDiaArgentina(instante)).toEqual(
      fechaArgentina(2026, 9, 30),
    );
  });
});

describe("buildFuncionesFiltro", () => {
  // 22:00 del jueves 29/10 en Argentina = 01:00 UTC del viernes 30/10
  const nocheEnArgentina = fechaArgentina(2026, 9, 29, 22);

  it("'hoy' cubre el día de Argentina aunque en UTC ya sea mañana", () => {
    expect(buildFuncionesFiltro("hoy", nocheEnArgentina)).toEqual({
      some: {
        fecha: {
          gte: fechaArgentina(2026, 9, 29),
          lt: fechaArgentina(2026, 9, 30),
        },
      },
    });
  });

  it("'semana' cubre 7 días desde hoy", () => {
    const { fecha } = buildFuncionesFiltro("semana", nocheEnArgentina).some;
    expect(fecha.gte).toEqual(fechaArgentina(2026, 9, 29));
    expect(fecha.lt).toEqual(fechaArgentina(2026, 10, 5));
  });

  it("'mes' cubre 30 días desde hoy", () => {
    const { fecha } = buildFuncionesFiltro("mes", nocheEnArgentina).some;
    expect(fecha.lt).toEqual(fechaArgentina(2026, 10, 28));
  });

  it("una función a las 23:30 de Argentina entra en 'hoy'", () => {
    const { fecha } = buildFuncionesFiltro("hoy", nocheEnArgentina).some;
    const funcion = fechaArgentina(2026, 9, 29, 23, 30);
    expect(funcion >= fecha.gte && funcion < fecha.lt).toBe(true);
  });
});
