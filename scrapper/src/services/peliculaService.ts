import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { Cine } from "../core/domain/cine.js";
import type { Scraper } from "../scrapers/scraper.js";
import type { INormalizadorPeliculas } from "../utils/normalizadorPeliculas.js";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";
import { crearContextoScraping } from "../scrapers/browserContext.js";

export interface IPeliculaService {
  normalizador: INormalizadorPeliculas;
  carteleraRepository: ICarteleraRepository;
  refrescarPeliculas(scrapers: Scraper[]): Promise<Pelicula[]>;
  scrapearCines(scrapers: Scraper[]): Promise<PeliculaInput[]>;
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

  async refrescarPeliculas(scrapers: Scraper[]): Promise<Pelicula[]> {
    const peliculasInput = await this.scrapearCines(scrapers);
    const peliculas = await this.normalizarPeliculas(peliculasInput);
    this.carteleraRepository.upsertPeliculas(peliculas);
    return peliculas;
  }

  //TODO los scrappers no corren simultaneamente, dejarlo claro en capas superiores
  async scrapearCines(scrapers: Scraper[]): Promise<PeliculaInput[]> {
    const context = await crearContextoScraping();
    const browser = context.browser()!;

    const results = await Promise.all(
      scrapers.map(async (scraper) => {
        const page = await context.newPage();
        try {
          return await scraper.ejecutar(page);
        } catch (error) {
          console.error(
            `Error al scrapear cine ${scraper.cine.nombre}:`,
            error,
          );
          return [];
        } finally {
          await page.close();
        }
      }),
    );

    await browser.close();

    return results.flat();
  }

  async normalizarPeliculas(
    peliculasInput: PeliculaInput[],
  ): Promise<Pelicula[]> {
    return this.normalizador.normalizar(peliculasInput);
  }
}
