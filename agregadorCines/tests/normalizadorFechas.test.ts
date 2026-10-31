import { describe, it, expect } from "vitest";
import { NormalizadorFechas } from "../src/utils/normalizadorFechas.js";
import {
  calendarioArgentina,
  fechaArgentina,
} from "../src/utils/fechasArgentina.js";

// Los asserts leen el día en hora de Argentina para que los tests den lo mismo
// en cualquier zona horaria (local en ART, CI en UTC).
const calendario = (fecha: Date | null) => {
  expect(fecha).not.toBeNull();
  return calendarioArgentina(fecha!);
};

describe("NormalizadorFechas", () => {
  const fechaHoy = fechaArgentina(2026, 2, 6, 12); // Viernes 6 de Marzo 2026, 12:00 ART

  it("debería normalizar 'hoy'", () => {
    const resultado = NormalizadorFechas.normalizar("Hoy", fechaHoy);
    expect(calendario(resultado)).toMatchObject({ dia: 6, mes: 2 });
  });

  it("debería devolver 'hoy' a las 00:00 de Argentina, no a la hora actual", () => {
    const resultado = NormalizadorFechas.normalizar("Hoy", fechaHoy);
    expect(resultado).toEqual(fechaArgentina(2026, 2, 6));
  });

  it("debería usar el día de Argentina aunque en UTC ya sea el día siguiente", () => {
    // 23:30 del viernes 6 en Argentina = 02:30 UTC del sábado 7
    const nocheEnArgentina = fechaArgentina(2026, 2, 6, 23, 30);
    const resultado = NormalizadorFechas.normalizar("Hoy", nocheEnArgentina);
    expect(calendario(resultado)).toMatchObject({ dia: 6, mes: 2 });
  });

  it("debería normalizar 'mañana'", () => {
    const resultado = NormalizadorFechas.normalizar("Mañana", fechaHoy);
    expect(calendario(resultado)).toMatchObject({ dia: 7, mes: 2 });
  });

  it("debería normalizar 'jueves 5' como el día anterior (si estamos a 6)", () => {
    const resultado = NormalizadorFechas.normalizar("jueves 5", fechaHoy);
    expect(calendario(resultado)).toMatchObject({
      dia: 5,
      mes: 2,
      diaSemana: 4, // Jueves
    });
  });

  it("debería normalizar 'sábado 7' como el día siguiente", () => {
    const resultado = NormalizadorFechas.normalizar("sábado 7", fechaHoy);
    expect(calendario(resultado)).toMatchObject({
      dia: 7,
      mes: 2,
      diaSemana: 6, // Sábado
    });
  });

  it("no debería pasar al mes siguiente un día que el mes no tiene", () => {
    // Abril tiene 30 días: "31 de abril" se desbordaría al viernes 1 de mayo.
    // No hay viernes 31 entre abril y junio 2026, así que no hay fecha válida.
    const resultado = NormalizadorFechas.normalizar(
      "viernes 31",
      fechaArgentina(2026, 3, 10),
    );
    expect(resultado).toBeNull();
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
    expect(calendario(resultado)).toMatchObject({ dia: 20, mes: 11 }); // Diciembre (0-indexed)
  });

  it("debería saltar al siguiente año si estamos en Diciembre y la fecha es Enero", () => {
    const resultado = NormalizadorFechas.normalizar(
      "5 de enero",
      fechaArgentina(2026, 11, 1),
    ); // Diciembre 2026 -> Enero 2027
    expect(calendario(resultado).anio).toBe(2027);
  });

  it("NO debería saltar al siguiente año si no estamos en Oct/Nov/Dic", () => {
    // Si estamos en Mayo y dice "10 de Enero", debería quedarse en 2026 (mes < mesRef pero no es fin de año)
    const resultado = NormalizadorFechas.normalizar(
      "10 de enero",
      fechaArgentina(2026, 4, 1),
    ); // Mayo 2026
    expect(calendario(resultado).anio).toBe(2026);
  });

  it("debería manejar formatos con basura", () => {
    const resultado = NormalizadorFechas.normalizar(
      "  PRÓXIMO viernes 6 !!! ",
      fechaHoy,
    );
    expect(calendario(resultado)).toMatchObject({ dia: 6, diaSemana: 5 }); // Viernes
  });

  it("debería normalizar una fecha ISO a las 00:00 de Argentina", () => {
    const resultado = NormalizadorFechas.normalizar("2026-10-31", fechaHoy);
    expect(resultado?.getTime()).toBe(fechaArgentina(2026, 9, 31).getTime());
  });

  it("debería tomar la hora de un texto con día de la semana", () => {
    const resultado = NormalizadorFechas.normalizar("Sábado 7 21:30", fechaHoy);
    expect(resultado?.getTime()).toBe(fechaArgentina(2026, 2, 7, 21, 30).getTime());
  });

  it("debería tomar la hora de un texto con mes sin confundirla con el día", () => {
    const resultado = NormalizadorFechas.normalizar("Domingo 1° de noviembre 15:00", fechaHoy);
    expect(resultado?.getTime()).toBe(fechaArgentina(2026, 10, 1, 15, 0).getTime());
  });

  it("debería normalizar una fecha ISO con hora en hora de Argentina", () => {
    const resultado = NormalizadorFechas.normalizar("2026-10-31 17:30", fechaHoy);
    expect(resultado?.getTime()).toBe(fechaArgentina(2026, 9, 31, 17, 30).getTime());
    expect(resultado?.toISOString()).toBe("2026-10-31T20:30:00.000Z");
  });
});
