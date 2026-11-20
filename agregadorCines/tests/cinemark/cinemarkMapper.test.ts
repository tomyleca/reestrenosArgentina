import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { cinemarkHoyts } from "../../src/config/cinesConfig.js";
import { cinemarkApiMapper } from "../../src/provider/mappers/cinemarkMapper.js";

const CINEMARK_CINE: Cine = { ...cinemarkHoyts, id: 1 };

describe("cinemarkApiMapper (unitario)", () => {
  test("mapea el título de cada película", () => {
    const respuesta = {
      data: [{ title: "ROCKY 50° ANIVERSARIO" }, { title: "CLAYFACE" }],
    };

    expect(cinemarkApiMapper(respuesta, CINEMARK_CINE)).toEqual([
      { titulo: "ROCKY 50° ANIVERSARIO", cine: CINEMARK_CINE },
      { titulo: "CLAYFACE", cine: CINEMARK_CINE },
    ]);
  });

  test("no usa openingDate como fecha de lanzamiento", () => {
    // openingDate es la llegada a Cinemark: en un reestreno es del año actual
    const respuesta = {
      data: [{ title: "ROCKY 50° ANIVERSARIO", openingDate: "2026-11-12T00:00:00.000Z" }],
    };

    const [pelicula] = cinemarkApiMapper(respuesta, CINEMARK_CINE);

    expect(pelicula?.fechaLanzamiento).toBeUndefined();
  });
});
