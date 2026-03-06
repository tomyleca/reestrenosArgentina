import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "../provider/ICineProvider.js";
import type { INormalizadorPeliculas } from "../utils/normalizadorPeliculas.js";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";

export interface IPeliculaService {
  normalizador: INormalizadorPeliculas;
  carteleraRepository: ICarteleraRepository;
  refrescarPeliculas(providers: ICineProvider[]): Promise<Pelicula[]>;
  obtenerPeliculas(providers: ICineProvider[]): Promise<PeliculaInput[]>;
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
    const peliculasInput = await this.obtenerPeliculas(providers);
    const peliculas = await this.normalizarPeliculas(peliculasInput);
    this.carteleraRepository.upsertPeliculas(peliculas);
    return peliculas;
  }

  async obtenerPeliculas(providers: ICineProvider[]): Promise<PeliculaInput[]> {
    const results: PeliculaInput[][] = [];
    for (const provider of providers) {
      try {
        const peliculas = await provider.obtenerPeliculas();
        console.log(
          `🎬 ${provider.cine.nombre}: ${peliculas.length} películas obtenidas.`,
        );
        results.push(peliculas);
      } catch (error) {
        console.error(
          `❌ Error al obtener películas de ${provider.cine.nombre}:`,
          error,
        );
      }
    }
    return results.flat();
  }

  async normalizarPeliculas(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]> {
    return this.normalizador.normalizar(peliculasInput);
  }
}
