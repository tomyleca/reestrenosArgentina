import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Page } from "playwright";
import type { Cine } from "../../src/core/domain/cine.js";
import { cinemarkHoyts } from "../../src/config/cinesConfig.js";
import { CinemarkScrapper } from "../../src/provider/scrappers/cinemarkScrapper.js";

const CINEMARK_CINE: Cine = { ...cinemarkHoyts, id: 1 };

// Doble de la página: el botón "Ver más" desaparece después de cierta cantidad
// de clics, como en el sitio cuando ya se cargaron todas las películas.
function crearPagina(clicsHastaDesaparecer: number) {
  let clics = 0;
  const botonVerMas = {
    isVisible: vi.fn(async () => clics < clicsHastaDesaparecer),
    click: vi.fn(async () => {
      if (clics >= clicsHastaDesaparecer) {
        throw new Error("Timeout esperando el botón");
      }
      clics++;
    }),
  };
  const botonAcepto = { click: vi.fn(async () => {}) };
  const page = {
    getByRole: (_rol: string, { name }: { name: string }) =>
      name === "Ver más" ? botonVerMas : botonAcepto,
    // Sin modal de publicidad
    waitForSelector: async () => {
      throw new Error("sin modal");
    },
    evaluate: async () => {},
    waitForTimeout: async () => {},
  };
  return { page: page as unknown as Page, botonVerMas, botonAcepto };
}

describe("CinemarkScrapper — botón Ver más", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no vuelve a tocar el botón si el primer clic ya cargó todo", async () => {
    const { page, botonVerMas } = crearPagina(1);

    await new CinemarkScrapper(CINEMARK_CINE).prepararPagina(page);

    expect(botonVerMas.click).toHaveBeenCalledTimes(1);
  });

  it("sigue tocando el botón mientras exista", async () => {
    const { page, botonVerMas } = crearPagina(3);

    await new CinemarkScrapper(CINEMARK_CINE).prepararPagina(page);

    expect(botonVerMas.click).toHaveBeenCalledTimes(3);
  });

  it("no toca nada si el botón no está", async () => {
    const { page, botonVerMas, botonAcepto } = crearPagina(0);

    await new CinemarkScrapper(CINEMARK_CINE).prepararPagina(page);

    expect(botonVerMas.click).not.toHaveBeenCalled();
    expect(botonAcepto.click).not.toHaveBeenCalled();
  });

  it("deja de tocar al llegar al tope si el botón nunca desaparece", async () => {
    const { page, botonVerMas } = crearPagina(Infinity);

    await new CinemarkScrapper(CINEMARK_CINE).prepararPagina(page);

    // El primer clic más los 10 del tope
    expect(botonVerMas.click).toHaveBeenCalledTimes(11);
  });
});
