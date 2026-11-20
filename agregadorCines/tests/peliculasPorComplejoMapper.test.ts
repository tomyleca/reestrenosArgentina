import { describe, test, expect } from "vitest";
import type { Cine } from "../src/core/domain/cine.js";
import { cinePixel } from "../src/config/cinesConfig.js";
import {
  peliculasPorComplejoMapper,
  type PeliculaPorComplejoItem,
} from "../src/provider/mappers/peliculasPorComplejoMapper.js";
import { fechaArgentina } from "../src/utils/fechasArgentina.js";

const CINE: Cine = { ...cinePixel, id: 99 };
// Jueves 20/11/2026 a las 15:00 de Argentina
const AHORA = fechaArgentina(2026, 10, 20, 15);

// Forma real de /Funciones/GetPeliculasPorComplejo, reducida a lo que usa el mapper
function item(
  titulo: string,
  tituloOriginal: string,
  fecha = "2026-11-20T00:00:00",
): PeliculaPorComplejoItem {
  return { fecha, cachePeliculas: { titulo, tituloOriginal } };
}

const mapear = (
  items: PeliculaPorComplejoItem[],
  ciclosPorPrefijo?: Record<string, string>,
) =>
  peliculasPorComplejoMapper(items, CINE, {
    ahora: AHORA,
    ...(ciclosPorPrefijo ? { ciclosPorPrefijo } : {}),
  });

describe("peliculasPorComplejoMapper (unitario)", () => {
  test("mapea el título de cada película", () => {
    expect(mapear([item("ROCKY", "ROCKY"), item("CLAYFACE", "CLAYFACE")])).toEqual([
      { titulo: "ROCKY", cine: CINE },
      { titulo: "CLAYFACE", cine: CINE },
    ]);
  });

  test("pasa el título original como contexto solo si es distinto", () => {
    const peliculas = mapear([item("ANIQUILACION", "ONSLAUGHT"), item("Rocky", "ROCKY")]);

    expect(peliculas[0]?.textoRaw).toBe("Título original: ONSLAUGHT");
    expect(peliculas[1]?.textoRaw).toBeUndefined();
  });

  test("no usa la fecha de estreno en el cine como fecha de lanzamiento", () => {
    const conEstreno = {
      fecha: "2026-11-20T00:00:00",
      cachePeliculas: {
        titulo: "ROCKY",
        tituloOriginal: "ROCKY",
        estreno: "2026-11-12T00:00:00",
      },
    };

    const [pelicula] = mapear([conEstreno]);

    expect(pelicula?.fechaLanzamiento).toBeUndefined();
  });

  test("busca por el título original si el local llega al tope y está cortado", () => {
    const [pelicula] = mapear([
      item("JUEGOS DEL HAMBRE:AMANECER EN", "The Hunger Games: Sunrise on the Reaping"),
    ]);

    expect(pelicula?.titulo).toBe("The Hunger Games: Sunrise on the Reaping");
    expect(pelicula?.textoRaw).toBe("Título en el cine: JUEGOS DEL HAMBRE:AMANECER EN");
  });

  test("saca el prefijo de un ciclo y lo informa como ciclo", () => {
    const [pelicula] = mapear([item("BARS:TERRIFIER 2", "Terrifier 2")], {
      "BARS:": "Buenos Aires Rojo Sangre",
    });

    expect(pelicula).toEqual({
      titulo: "TERRIFIER 2",
      cine: CINE,
      ciclo: "Buenos Aires Rojo Sangre",
    });
  });

  test("deja afuera las preventas con la primera función después de los próximos 7 días", () => {
    const peliculas = mapear([
      item("ROCKY", "ROCKY", "2026-11-27T00:00:00"), // dentro de 7 días
      item("AVENGERS: DOOMSDAY", "Avengers: Doomsday", "2026-11-28T00:00:00"),
      item("DUNA: PARTE TRES", "Dune: Part Three", "2026-12-15T00:00:00"),
    ]);

    expect(peliculas.map((p) => p.titulo)).toEqual(["ROCKY"]);
  });

  test("descarta entradas sin título y títulos repetidos", () => {
    const peliculas = mapear([
      item("ROCKY", "ROCKY"),
      item("  rocky ", "ROCKY"),
      item("   ", "SIN TITULO"),
      { cachePeliculas: null },
      {},
    ]);

    expect(peliculas.map((p) => p.titulo)).toEqual(["ROCKY"]);
  });

  test("devuelve vacío si la respuesta no es una lista", () => {
    // La API anterior de Pixel respondía { status, data }: un cambio de formato
    // tiene que dar vacío para que el provider pase al scraper.
    const formatoViejo = { status: "ok", data: [] } as unknown as PeliculaPorComplejoItem[];

    expect(mapear(formatoViejo)).toEqual([]);
  });
});
