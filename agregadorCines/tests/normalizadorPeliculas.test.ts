import { describe, it, expect } from "vitest";
import { NormalizadorPeliculas } from "../src/utils/normalizadorPeliculas.js";
import type { IDatosPeliculaGetter } from "../src/core/interfaces/IDatosPeliculaGetter.js";

// limpiarTitulo no usa el getter de datos
const normalizador = new NormalizadorPeliculas({} as IDatosPeliculaGetter);
const limpiar = (titulo: string) => normalizador.limpiarTitulo(titulo);

describe("NormalizadorPeliculas.limpiarTitulo", () => {
  it("quita formato e idioma", () => {
    expect(limpiar("AVATAR 3D SUBTITULADA")).toBe("AVATAR");
    expect(limpiar("DUNA IMAX DOBLADA")).toBe("DUNA");
  });

  it("quita lo que está entre paréntesis o corchetes", () => {
    expect(limpiar("EL PADRINO (1972)")).toBe("EL PADRINO");
    expect(limpiar("ALIEN [Director's Cut]")).toBe("ALIEN");
  });

  it("quita el aniversario de los reestrenos", () => {
    expect(limpiar("ROCKY 50° ANIVERSARIO")).toBe("ROCKY");
    expect(limpiar("TITANIC: 25º ANIVERSARIO")).toBe("TITANIC");
    expect(limpiar("VOLVER AL FUTURO - 40 Aniversario")).toBe("VOLVER AL FUTURO");
  });

  it("no deja separadores colgando al final", () => {
    expect(limpiar("MATRIX - SUBTITULADA")).toBe("MATRIX");
    expect(limpiar("MATRIX: 2D")).toBe("MATRIX");
  });

  it("no toca los títulos que no tienen nada para limpiar", () => {
    expect(limpiar("JU-ON: EL GRITO")).toBe("JU-ON: EL GRITO");
    expect(limpiar("El aniversario")).toBe("El aniversario");
    expect(limpiar("2001: Odisea del espacio")).toBe("2001: Odisea del espacio");
  });
});
