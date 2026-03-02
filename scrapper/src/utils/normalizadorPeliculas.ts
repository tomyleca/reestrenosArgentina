import type { Pelicula } from "../core/domain/pelicula.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { IDatosPeliculaGetter } from "../core/interfaces/IDatosPeliculaGetter.js";

export interface INormalizadorPeliculas {
  normalizar(peliculasInput: PeliculaInput[]): Promise<Pelicula[]>;
  limpiarTitulo(titulo: string): string;
}

export class NormalizadorPeliculas implements INormalizadorPeliculas {
  datosPeliculaGetter: IDatosPeliculaGetter;

  constructor(datosPeliculaGetter: IDatosPeliculaGetter) {
    this.datosPeliculaGetter = datosPeliculaGetter;
  }

  async normalizar(peliculasInput: PeliculaInput[]): Promise<Pelicula[]> {
    //limpio el titulo de todas las peliculas antes de mandarselo al getter
    const peliculasNormalizadas = peliculasInput.map((pelicula) => ({
      ...pelicula,
      titulo: this.limpiarTitulo(pelicula.titulo),
    }));
    return this.datosPeliculaGetter.getPeliculasFromScrapeado(peliculasNormalizadas);
  }

  limpiarTitulo(titulo: string): string {
    const tags = [
      /\b(2D|3D|4D|4DX)\b/gi,
      /\b(SUBT(ITULAD[AO])?|SUB)\b/gi,
      /\b(DOB(LAD[AO])?|ESP)\b/gi,
      /\b(IMAX|PREMIUM|HFR|ATMOS|SCREENX|D-BOX)\b/gi,
      /\b(DIGI|DIGITAL)\b/gi,
      /[\(\[\{][^\)\]\}]*[\)\]\}]/g,
    ];

    let resultado = titulo;
    for (const tag of tags) {
      resultado = resultado.replace(tag, "");
    }

    // Los reemplazos anteriores pueden dejar guiones/comas colgantes al final
    // o espacios múltiples en el medio del título.
    return resultado
      .replace(/[-|:,]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
}
