import { describe, it, expect } from "vitest";
import { PeliculaService } from "../src/services/peliculaService.js";
import type { ICineProvider } from "../src/provider/ICineProvider.js";
import type { INormalizadorPeliculas } from "../src/utils/normalizadorPeliculas.js";
import type {
  ICarteleraRepository,
  PeliculaEnCine,
} from "../src/repositories/ICarteleraRepository.js";
import type { Cine } from "../src/core/domain/cine.js";
import type { Pelicula } from "../src/core/domain/pelicula.js";
import type { PeliculaInput } from "../src/core/dtos/peliculaInput.js";

const malba: Cine = { id: 1, nombre: "Cine Malba", localidad: "CABA", url: "", tieneFunciones: true };
const cinemark: Cine = { id: 2, nombre: "Cinemark", localidad: "CABA", url: "", tieneFunciones: false };
const jueves = new Date(2026, 9, 29);

// Dobles simples: el repositorio registra qué cines se reemplazaron y las alertas
function crearRepositorio() {
  const reemplazos = new Map<number, PeliculaEnCine[]>();
  const alertas: string[] = [];
  const repositorio = {
    upsertPeliculas: async () => {},
    reemplazarCarteleraDeCine: async (cineId: number, peliculas: PeliculaEnCine[]) => {
      reemplazos.set(cineId, peliculas);
    },
    agregarAlerta: async (alerta: { mensaje: string }) => {
      alertas.push(alerta.mensaje);
    },
  } as unknown as ICarteleraRepository;
  return { repositorio, reemplazos, alertas };
}

function provider(cine: Cine, obtener: () => Promise<PeliculaInput[]>): ICineProvider {
  return { cine, obtenerPeliculas: obtener };
}

// El normalizador devuelve una película por input, con la función si el input trae fecha
const normalizador = {
  normalizar: async (inputs: PeliculaInput[]): Promise<Pelicula[]> =>
    inputs.map((input) => ({
      id: 1,
      titulo: input.titulo,
      descripcion: "",
      generos: [],
      duracionMinutos: 100,
      categoria: "REESTRENOS",
      cines: [input.cine],
      tmdbId: 807,
      funciones: input.fecha instanceof Date ? [{ fecha: input.fecha, cineId: input.cine.id }] : [],
    })),
} as unknown as INormalizadorPeliculas;

describe("PeliculaService - cartelera por cine", () => {
  it("reemplaza la cartelera de un cine con funciones que trajo fechas", async () => {
    const { repositorio, reemplazos } = crearRepositorio();
    const service = new PeliculaService(repositorio, normalizador);

    await service.refrescarPeliculas([
      provider(malba, async () => [{ titulo: "Seven", cine: malba, fecha: jueves }]),
    ]);

    expect(reemplazos.get(malba.id)).toEqual([{ tmdbId: 807, fechas: [jueves] }]);
  });

  it("no toca un cine con funciones que trajo películas sin fechas", async () => {
    const { repositorio, reemplazos, alertas } = crearRepositorio();
    const service = new PeliculaService(repositorio, normalizador);

    await service.refrescarPeliculas([
      provider(malba, async () => [{ titulo: "Seven", cine: malba }]),
    ]);

    expect(reemplazos.has(malba.id)).toBe(false);
    expect(alertas).toHaveLength(1);
  });

  it("reemplaza la cartelera de un cine sin funciones aunque no traiga fechas", async () => {
    const { repositorio, reemplazos } = crearRepositorio();
    const service = new PeliculaService(repositorio, normalizador);

    await service.refrescarPeliculas([
      provider(cinemark, async () => [{ titulo: "Seven", cine: cinemark }]),
    ]);

    expect(reemplazos.get(cinemark.id)).toEqual([{ tmdbId: 807, fechas: [] }]);
  });

  it("si un provider falla, no toca ese cine pero sí actualiza los demás", async () => {
    const { repositorio, reemplazos, alertas } = crearRepositorio();
    const service = new PeliculaService(repositorio, normalizador);

    await service.refrescarPeliculas([
      provider(malba, async () => {
        throw new Error("timeout");
      }),
      provider(cinemark, async () => [{ titulo: "Seven", cine: cinemark }]),
    ]);

    expect(reemplazos.has(malba.id)).toBe(false);
    expect(reemplazos.has(cinemark.id)).toBe(true);
    expect(alertas).toHaveLength(1);
  });
});
