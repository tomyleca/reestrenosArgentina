import { describe, it, expect } from "vitest";
import {
  parsearCiclo,
  parsearLineaHorarios,
  parsearPeliculaUnica,
} from "../../src/provider/scrappers/parsers/lugonesParser.js";

// Bloques = líneas de cada <p>/<h4> de la página, tomados de los formatos reales del sitio

describe("parsearCiclo", () => {
  it("lee el formato actual: día, horarios y película con ficha en el mismo párrafo", () => {
    const funciones = parsearCiclo([
      ["Viernes 23"],
      ["A las 15 horas"],
      ["El ángel de la calle", "(Street Angel; EE.UU; 1928)", "Dirección: Frank Borzage.", "Con Janet Gaynor."],
      ["Sábado 24"],
      ["A las 14.30 horas"],
      ["Una chica mala", "(Bad Girl; EE.UU; 1931)", "Dirección: Frank Borzage."],
    ]);

    expect(funciones).toEqual([
      expect.objectContaining({ titulo: "El ángel de la calle", fecha: "Viernes 23 15:00", director: "Frank Borzage", anioLanzamiento: 1928 }),
      expect.objectContaining({ titulo: "Una chica mala", fecha: "Sábado 24 14:30", anioLanzamiento: 1931 }),
    ]);
  });

  it("genera una función por cada horario de un mismo día", () => {
    const funciones = parsearCiclo([
      ["Domingo 1° de noviembre"],
      ["A las 15 y 21 horas"],
      ["Tigre de la China", "(China Doll; EE.UU; 1958)"],
    ]);

    expect(funciones.map((f) => f.fecha)).toEqual([
      "Domingo 1° de noviembre 15:00",
      "Domingo 1° de noviembre 21:00",
    ]);
  });

  it("lee el formato anterior: ficha sola y título en el párrafo previo", () => {
    const funciones = parsearCiclo([
      ["Jueves 15"],
      ["A las 20.30 horas"],
      ["Las alas del deseo"],
      ["(Der Himmel über Berlin; República Federal de Alemania/Reino Unido/Francia, 1987)"],
    ]);

    expect(funciones).toEqual([
      expect.objectContaining({ titulo: "Las alas del deseo", fecha: "Jueves 15 20:30", anioLanzamiento: 1987 }),
    ]);
  });

  it("no devuelve nada en una página de película única", () => {
    expect(
      parsearCiclo([["SINOPSIS"], ["Jueves 5, viernes 6 y sábado 7, 21 horas"], ["Argentina – 2025"]]),
    ).toEqual([]);
  });
});

describe("parsearLineaHorarios", () => {
  it("un día con mes y hora", () => {
    expect(parsearLineaHorarios("Sábado 31 de octubre, 21 horas")).toEqual(["Sábado 31 de octubre 21:00"]);
  });

  it("varios días con la misma hora", () => {
    expect(parsearLineaHorarios("Jueves 5, viernes 6 y sábado 7, 21 horas")).toEqual([
      "Jueves 5 21:00",
      "viernes 6 21:00",
      "sábado 7 21:00",
    ]);
  });

  it("los días sin mes toman el del último día", () => {
    expect(parsearLineaHorarios("El viernes 20 y el domingo 22 de noviembre, 21 horas")).toEqual([
      "viernes 20 de noviembre 21:00",
      "domingo 22 de noviembre 21:00",
    ]);
  });

  it("con 'a las' y minutos", () => {
    expect(parsearLineaHorarios("Viernes 20 y domingo 22 a las 20.30 horas")).toEqual([
      "Viernes 20 20:30",
      "domingo 22 20:30",
    ]);
  });

  it("ignora líneas sin hora o sin días", () => {
    expect(parsearLineaHorarios("Viernes 23")).toEqual([]);
    expect(parsearLineaHorarios("A las 15 horas")).toEqual([]);
    expect(parsearLineaHorarios("TODAS LAS FUNCIONES COMIENZAN PUNTUALMENTE EN EL HORARIO ANUNCIADO")).toEqual([]);
  });
});

describe("parsearPeliculaUnica", () => {
  it("usa el h1 como título y lee horarios, año y director", () => {
    const funciones = parsearPeliculaUnica("Museo de la subversión", [
      ["TODAS LAS FUNCIONES COMIENZAN PUNTUALMENTE EN EL HORARIO ANUNCIADO"],
      ["Jueves 5, viernes 6 y sábado 7, 21 horas", "Domingo 8 y jueves 12, 18 horas"],
      ["SINOPSIS"],
      ["Argentina – 2025", "Español – Color / B&N", "70 minutos – DCP 2K"],
      ["Dirección: Francisco D´Eufemia (CdC)", "Guion: Fernando Krapp."],
    ]);

    expect(funciones.map((f) => f.fecha)).toEqual([
      "Jueves 5 21:00",
      "viernes 6 21:00",
      "sábado 7 21:00",
      "Domingo 8 18:00",
      "jueves 12 18:00",
    ]);
    expect(funciones[0]).toMatchObject({
      titulo: "Museo de la subversión",
      anioLanzamiento: 2025,
      director: "Francisco D´Eufemia (CdC)",
    });
  });

  it("lee un horario por h4 y no duplica fechas repetidas", () => {
    const funciones = parsearPeliculaUnica("El joven Frankenstein", [
      ["Sábado 31 de octubre, 21 horas"],
      ["Domingo 1° de noviembre, 18 horas"],
      ["Sábado 31 de octubre, 21 horas"],
      ["Estados Unidos, 1974", "106 minutos"],
    ]);

    expect(funciones.map((f) => f.fecha)).toEqual([
      "Sábado 31 de octubre 21:00",
      "Domingo 1 de noviembre 18:00",
    ]);
    expect(funciones[0]?.anioLanzamiento).toBe(1974);
  });

  it("sin título no devuelve nada", () => {
    expect(parsearPeliculaUnica(undefined, [["Sábado 31 de octubre, 21 horas"]])).toEqual([]);
  });
});
