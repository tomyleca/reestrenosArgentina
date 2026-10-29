import { fusionarPeliculas, type Pelicula } from "../core/domain/pelicula.js";
import type { Cine } from "../core/domain/cine.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "../provider/ICineProvider.js";
import type { INormalizadorPeliculas } from "../utils/normalizadorPeliculas.js";
import type {
  ICarteleraRepository,
  PeliculaEnCine,
} from "../repositories/ICarteleraRepository.js";
import { randomUUID } from "node:crypto";

// Lo que trajo el provider de un cine que no tiró error
export interface ResultadoCine {
  cine: Cine;
  peliculasInput: PeliculaInput[];
}

export interface IPeliculaService {
  normalizador: INormalizadorPeliculas;
  carteleraRepository: ICarteleraRepository;
  refrescarPeliculas(providers: ICineProvider[]): Promise<Pelicula[]>;
  obtenerPeliculas(providers: ICineProvider[]): Promise<ResultadoCine[]>;
  normalizarPeliculas(peliculasInput: PeliculaInput[]): Promise<Pelicula[]>;
}

export class PeliculaService implements IPeliculaService {
  normalizador: INormalizadorPeliculas;
  carteleraRepository: ICarteleraRepository;

  constructor(
    carteleraRepository: ICarteleraRepository,
    normalizador: INormalizadorPeliculas,
  ) {
    this.carteleraRepository = carteleraRepository;
    this.normalizador = normalizador;
  }

  async refrescarPeliculas(providers: ICineProvider[]): Promise<Pelicula[]> {
    const resultados = await this.obtenerPeliculas(providers);
    const peliculas = fusionarPeliculas(
      await this.normalizarPeliculas(
        resultados.flatMap((r) => r.peliculasInput),
      ),
    );
    await this.carteleraRepository.upsertPeliculas(peliculas);

    for (const { cine } of resultados) {
      await this.actualizarCarteleraDeCine(cine, peliculas);
    }
    return peliculas;
  }

  // Reemplaza la cartelera del cine solo si el scraping salió bien. Si no, la
  // deja como estaba: sus funciones futuras se siguen mostrando y el cine se
  // "apaga" de a poco, mientras ultimaActualizacion avisa que está desactualizado.
  private async actualizarCarteleraDeCine(
    cine: Cine,
    peliculas: Pelicula[],
  ): Promise<void> {
    const peliculasEnCine: PeliculaEnCine[] = peliculas
      .filter((p) => p.tmdbId != null && p.cines.some((c) => c.id === cine.id))
      .map((p) => ({
        tmdbId: p.tmdbId!,
        fechas: (p.funciones ?? [])
          .filter((f) => f.cineId === cine.id)
          .map((f) => f.fecha),
      }));
    const cantidadFunciones = peliculasEnCine.reduce(
      (total, p) => total + p.fechas.length,
      0,
    );

    // Un cine con funciones que trae películas pero ninguna fecha casi seguro
    // tiene roto el selector de fecha: cuenta como falla.
    const fallo =
      peliculasEnCine.length === 0 ||
      (cine.tieneFunciones && cantidadFunciones === 0);

    if (fallo) {
      await this.carteleraRepository.agregarAlerta({
        id: randomUUID(),
        mensaje: `No se actualizó la cartelera de "${cine.nombre}": se obtuvieron ${peliculasEnCine.length} películas y ${cantidadFunciones} funciones.`,
        fecha: new Date(),
      });
      console.warn(
        `⚠️ ${cine.nombre}: no se actualizó la cartelera (${peliculasEnCine.length} películas, ${cantidadFunciones} funciones).`,
      );
      return;
    }

    await this.carteleraRepository.reemplazarCarteleraDeCine(
      cine.id,
      peliculasEnCine,
    );
    console.log(
      `✅ ${cine.nombre}: ${peliculasEnCine.length} películas, ${cantidadFunciones} funciones.`,
    );
  }

  async obtenerPeliculas(providers: ICineProvider[]): Promise<ResultadoCine[]> {
    const resultados: ResultadoCine[] = [];
    for (const provider of providers) {
      try {
        const peliculasInput = await provider.obtenerPeliculas();
        console.log(
          `🎬 ${provider.cine.nombre}: ${peliculasInput.length} películas obtenidas.`,
        );
        resultados.push({ cine: provider.cine, peliculasInput });
      } catch (error) {
        console.error(
          `❌ Error al obtener películas de ${provider.cine.nombre}:`,
          error,
        );
        await this.carteleraRepository.agregarAlerta({
          id: randomUUID(),
          mensaje: `Error al obtener películas de "${provider.cine.nombre}": ${error instanceof Error ? error.message : error}`,
          fecha: new Date(),
        });
      }
    }
    return resultados;
  }

  async normalizarPeliculas(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]> {
    return this.normalizador.normalizar(peliculasInput);
  }
}
