import "dotenv/config";
import axios from "axios";
import type { TMDBPeliculaDetalleDTO } from "../core/dtos/tmdbPeliculaDetalleDTO.js";


import stringSimilarity from "string-similarity";

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;
let MARGEN_FECHA = TREINTA_DIAS_MS;
const MIN_SIMILARITY_SCORE = 0.1; // Umbral de similitud para aceptar un resultado. Es conveniente que sea muy bajo hasta lo podría eliminar.

export class TMDB {
  async buscarPeliculaId(
    titulo: string,
    fechaLanzamiento?: Date,
  ): Promise<number | null> {
    const response = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
        params: {
          query: titulo,
          language: "es-AR",
          region: "AR",
        },
      },
    );

    const resultados = response.data.results;
    if (resultados.length === 0) return null;

    // 1. Normalizamos el título buscado para la comparación.( No es lo mismo que la limpieza que se hace en el adapter)
    const tituloBusquedaNorm = this.normalizarTitulo(titulo);

    // 2. Calculamos el score de similitud para cada resultado (contra title y original_title).
    const candidatosConScore = resultados.map((p: any) => {
      const scoreTitulo = stringSimilarity.compareTwoStrings(
        tituloBusquedaNorm,
        this.normalizarTitulo(p.title),
      );

	  //le asigno un score tambien al titulo en ingles
      const scoreOriginal = stringSimilarity.compareTwoStrings(
        tituloBusquedaNorm,
        this.normalizarTitulo(p.original_title),
      );

	  //me quedo con el score mas alto
      return { ...p, score: Math.max(scoreTitulo, scoreOriginal) };
    });

    // 3. Filtramos por un umbral mínimo de similitud para evitar falsos positivos
    // (ej: si buscas "The Batman" y te devuelve "Batman" con score bajo).
    const candidatosValidos = candidatosConScore.filter(
      (p: any) => p.score >= MIN_SIMILARITY_SCORE,
    );

    if (candidatosValidos.length === 0) {
      console.warn(`⚠️ No se encontró una coincidencia con similitud suficiente para: "${titulo}"`);
      return null;
    }

    // 4. De los válidos, filtramos por fecha si existe (teniendo en cuenta el margen definido).
    const candidatosPorFecha = fechaLanzamiento
      ? this.filtrarPorFecha(candidatosValidos, fechaLanzamiento)
      : candidatosValidos;

    // 5. Si el filtro de fecha dejó candidatos, elegimos el de mayor score de similitud.
    // Si hay empate en similitud (score > 0.95), caemos en popularidad.
    const pool = candidatosPorFecha.length > 0 ? candidatosPorFecha : candidatosValidos;

    // Ordenamos primero por score (descendente) 
    const ganador = pool.sort((a: any, b: any) => {
      if (Math.abs(b.score - a.score) > 0.05) {
        return b.score - a.score; 
      }
      // y luego por popularidad(si el score es muy cercano).
      return b.popularity - a.popularity;
    })[0];

    return ganador.id;
  }

  private normalizarTitulo(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9\s]/g, "") // Solo letras, números y espacios
      .trim();
  }

  // reduce recorre el array comparando de a pares (prev vs curr)
  // y se queda con el que tiene mayor popularity.
  // Al terminar, mas_popular es el objeto ganador de toda la lista.
  private getMasPopular(
    resultados: { id: number; popularity: number }[],
  ): number {
    return resultados.reduce((prev, curr) =>
      curr.popularity > prev.popularity ? curr : prev,
    ).id;
  }

  private filtrarPorFecha(
    resultados: any[],
    fechaLanzamiento: Date,
  ): any[] {
    return resultados.filter((p) => {
      if (!p.release_date) return false;
      const diff = Math.abs(
        new Date(p.release_date).getTime() - fechaLanzamiento.getTime(),
      );
      return diff <= MARGEN_FECHA;
    });
  }

  async buscarDetallesDePelicula(id: number): Promise<TMDBPeliculaDetalleDTO> {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
        params: {
          language: "es-MX",
          region: "MX",
        },
      },
    );
    return response.data;
  }
}
