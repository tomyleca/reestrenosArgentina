import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { cineCEA } from "../../src/config/cinesConfig.js";
import {
  ceaApiMapper,
  type CeaApiResponse,
} from "../../src/provider/mappers/ceaMapper.js";

const CEA_CINE: Cine = { ...cineCEA, id: 999 };

describe("ceaApiMapper (unitario)", () => {
  test("debería mapear correctamente las películas de la respuesta de CEA", () => {
    const mockResponse: CeaApiResponse = {
      ciclo: "Ciclo · Septiembre 2026",
      resumen: "4 funciones · 3 — 6 Septiembre<br>19hs hs · Colón 1133 · Avellaneda",
      rangoFechas: "3 al 6 de Septiembre · 19hs hs",
      peliculas: [
        {
          id: 1,
          titulo: "Destino de un capricho",
          tituloPlano: "Destino de un capricho",
          director: "Leo Fleider",
          anio: 1972,
          formato: "Digital",
          badge2: "ATP",
          dia: "3",
          diaSemana: "Jueves",
          diaSemanaCorto: "Jue",
          mes: "Septiembre",
          hora: "19hs",
          posterBase: "cartelera_1",
          formUrl: "https://forms.gle/yUPhTdqo9vjLTc3w9",
        },
        {
          id: 2,
          titulo: "Muchacho<br>Edición Especial",
          tituloPlano: "Muchacho",
          director: "Leo Fleider",
          anio: 1970,
          dia: 4,
          mes: "Septiembre",
        },
      ],
    };

    const resultado = ceaApiMapper(mockResponse, CEA_CINE);

    expect(resultado).toHaveLength(2);

    expect(resultado[0]).toEqual({
      titulo: "Destino de un capricho",
      cine: CEA_CINE,
      director: "Leo Fleider",
      anioLanzamiento: 1972,
      ciclo: "Ciclo · Septiembre 2026",
      fecha: "3 de Septiembre",
    });

    expect(resultado[1]).toEqual({
      titulo: "Muchacho",
      cine: CEA_CINE,
      director: "Leo Fleider",
      anioLanzamiento: 1970,
      ciclo: "Ciclo · Septiembre 2026",
      fecha: "4 de Septiembre",
    });
  });

  test("debería ignorar elementos vacíos o sin título", () => {
    const mockResponse: CeaApiResponse = {
      ciclo: "Ciclo Vacío",
      peliculas: [
        { id: 1, titulo: "", tituloPlano: "" },
        { id: 2, titulo: "   " },
        null as any,
      ],
    };

    const resultado = ceaApiMapper(mockResponse, CEA_CINE);
    expect(resultado).toEqual([]);
  });

  test("debería dedupicar títulos repetidos", () => {
    const mockResponse: CeaApiResponse = {
      ciclo: "Ciclo Duplicado",
      peliculas: [
        { id: 1, titulo: "Gitano" },
        { id: 2, titulo: "GITANO" },
      ],
    };

    const resultado = ceaApiMapper(mockResponse, CEA_CINE);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]!.titulo).toBe("Gitano");
  });

  test("debería conservar cada función de una película repetida en distintas fechas", () => {
    const mockResponse: CeaApiResponse = {
      peliculas: [
        { id: 1, titulo: "Gitano", dia: 5, mes: "marzo" },
        { id: 2, titulo: "Gitano", dia: 12, mes: "marzo" },
      ],
    };

    const resultado = ceaApiMapper(mockResponse, CEA_CINE);
    expect(resultado.map((p) => p.fecha)).toEqual(["5 de marzo", "12 de marzo"]);
  });

  test("debería retornar array vacío si la respuesta es null o malformada", () => {
    expect(ceaApiMapper(null as any, CEA_CINE)).toEqual([]);
    expect(ceaApiMapper({} as any, CEA_CINE)).toEqual([]);
  });
});
