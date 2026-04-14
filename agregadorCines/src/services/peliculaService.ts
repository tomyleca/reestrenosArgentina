import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { ICineProvider } from "../provider/ICineProvider.js";
import type { INormalizadorPeliculas } from "../utils/normalizadorPeliculas.js";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";
import { randomUUID } from "node:crypto";

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
    await this.carteleraRepository.limpiarCartelera();
    const peliculasInput = await this.obtenerPeliculas(providers);
    const peliculas = await this.normalizarPeliculas(peliculasInput);
    await this.carteleraRepository.upsertPeliculas(peliculas);
    return peliculas;
  }

  async obtenerPeliculas(providers: ICineProvider[]): Promise<PeliculaInput[]> {
    const results: PeliculaInput[][] = [];
    for (const provider of providers) {
      try {
        const peliculas = await provider.obtenerPeliculas();
		if(peliculas?.length === 0 || !peliculas){
			 await this.carteleraRepository.agregarAlerta({
					  id: randomUUID(),
					  mensaje: `No se pudieron obtener películas para el cine "${provider.cine.nombre}"`,
					  fecha: new Date(),
					});
		}
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
