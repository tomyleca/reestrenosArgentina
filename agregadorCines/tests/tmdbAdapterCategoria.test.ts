import { describe, it, expect } from "vitest";
import { TMDBAdapter } from "../src/adapters/tmdbAdapter.js";
import type { TMDB } from "../src/adapters/tmdb.js";
import type { ICarteleraRepository } from "../src/repositories/ICarteleraRepository.js";
import type { Pelicula } from "../src/core/domain/pelicula.js";
import type { Cine } from "../src/core/domain/cine.js";

const malba: Cine = { id: 1, nombre: "Cine Malba", localidad: "CABA", url: "" };

// Dobles simples: sin llamadas reales a TMDB
function crearAdapter(peliculaGuardada: Pelicula): TMDBAdapter {
  const tmdb = {
    buscarPeliculaId: async () => peliculaGuardada.tmdbId,
  } as unknown as TMDB;
  const repositorio = {
    buscarPorTMDBId: async () => ({ ...peliculaGuardada }),
  } as unknown as ICarteleraRepository;
  return new TMDBAdapter(tmdb, repositorio);
}

function crearPelicula(fechaLanzamiento: Date | null): Pelicula {
  return {
    id: 10,
    titulo: "Pelicula X",
    descripcion: "",
    generos: [],
    duracionMinutos: 100,
    categoria: "ESTRENOS",
    cines: [],
    activa: false,
    tmdbId: 500,
    fechaLanzamiento,
    funciones: [],
  };
}

describe("TMDBAdapter - recálculo de categoría", () => {
  it("una película guardada como estreno hace más de un año vuelve como reestreno", async () => {
    const haceDosAnios = new Date();
    haceDosAnios.setFullYear(haceDosAnios.getFullYear() - 2);
    const adapter = crearAdapter(crearPelicula(haceDosAnios));

    const resultado = await adapter.getPeliculaFromScrapeado({
      titulo: "Pelicula X",
      cine: malba,
    });

    expect(resultado.categoria).toBe("REESTRENOS");
  });

  it("una película lanzada hace menos de un año sigue como estreno", async () => {
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);
    const adapter = crearAdapter(crearPelicula(haceUnMes));

    const resultado = await adapter.getPeliculaFromScrapeado({
      titulo: "Pelicula X",
      cine: malba,
    });

    expect(resultado.categoria).toBe("ESTRENOS");
  });

  it("una película sin fecha de lanzamiento conserva la categoría guardada", async () => {
    const adapter = crearAdapter(crearPelicula(null));

    const resultado = await adapter.getPeliculaFromScrapeado({
      titulo: "Pelicula X",
      cine: malba,
    });

    expect(resultado.categoria).toBe("ESTRENOS");
  });
});
