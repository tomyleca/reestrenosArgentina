import { describe, test, expect } from "vitest";
import type { Cine } from "../../src/core/domain/cine.js";
import { cinePixel } from "../../src/config/cinesConfig.js";
import {
  cinePixelApiMapper,
  type CinePixelApiItem,
} from "../../src/provider/mappers/cinePixelMapper.js";

const CINE_PIXEL_CINE: Cine = { ...cinePixel, id: 99 };

// Forma real de /Funciones/GetPeliculasPorComplejo, reducida a lo que usa el mapper
function item(titulo: string, tituloOriginal: string): CinePixelApiItem {
  return { cachePeliculas: { titulo, tituloOriginal } };
}

describe("cinePixelApiMapper (unitario)", () => {
  test("mapea el título de cada película", () => {
    const peliculas = cinePixelApiMapper(
      [item("ROCKY", "ROCKY"), item("CLAYFACE", "CLAYFACE")],
      CINE_PIXEL_CINE,
    );

    expect(peliculas).toEqual([
      { titulo: "ROCKY", cine: CINE_PIXEL_CINE },
      { titulo: "CLAYFACE", cine: CINE_PIXEL_CINE },
    ]);
  });

  test("pasa el título original como contexto solo si es distinto", () => {
    const peliculas = cinePixelApiMapper(
      [item("ANIQUILACION", "ONSLAUGHT"), item("Rocky", "ROCKY")],
      CINE_PIXEL_CINE,
    );

    expect(peliculas[0]?.textoRaw).toBe("Título original: ONSLAUGHT");
    expect(peliculas[1]?.textoRaw).toBeUndefined();
  });

  test("no usa la fecha de estreno en el cine como fecha de lanzamiento", () => {
    const conEstreno = {
      cachePeliculas: {
        titulo: "ROCKY",
        tituloOriginal: "ROCKY",
        estreno: "2026-11-12T00:00:00",
      },
    };

    const [pelicula] = cinePixelApiMapper([conEstreno], CINE_PIXEL_CINE);

    expect(pelicula?.fechaLanzamiento).toBeUndefined();
  });

  test("descarta entradas sin título y títulos repetidos", () => {
    const peliculas = cinePixelApiMapper(
      [
        item("ROCKY", "ROCKY"),
        item("  rocky ", "ROCKY"),
        item("   ", "SIN TITULO"),
        { cachePeliculas: null },
        {},
      ],
      CINE_PIXEL_CINE,
    );

    expect(peliculas.map((p) => p.titulo)).toEqual(["ROCKY"]);
  });

  test("devuelve vacío si la respuesta no es una lista", () => {
    // La API anterior respondía { status, data }: un cambio de formato tiene
    // que dar vacío para que el provider pase al scraper.
    const formatoViejo = { status: "ok", data: [] } as unknown as CinePixelApiItem[];

    expect(cinePixelApiMapper(formatoViejo, CINE_PIXEL_CINE)).toEqual([]);
  });
});
