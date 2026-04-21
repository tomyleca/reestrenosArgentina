import "dotenv/config";
import axios from "axios";
import type { TMDBPeliculaDetalleDTO } from "../core/dtos/tmdbPeliculaDetalleDTO.js";

import stringSimilarity from "string-similarity";
import { tmdbLogger, type CandidatoConScore } from "./tmdbLogger.js";

const CUATRO_MESES_MS = 4 * 30 * 24 * 60 * 60 * 1000;
const CUATRO_MESES_DIAS = 4 * 30;
let MARGEN_FECHA = CUATRO_MESES_MS; //Es tan grande pq las peliculas tardan en estrenarse en arg.
const MIN_SIMILARITY_SCORE = 0.1; // Umbral de similitud para aceptar un resultado. Es conveniente que sea muy bajo hasta lo podría eliminar.

export class TMDB {
  async buscarPeliculaId(
    titulo: string,
    fechaLanzamiento?: Date,
    anioLanzamiento?: number,
  ): Promise<number | null> {
    tmdbLogger.busqueda(titulo, fechaLanzamiento);

    const params: Record<string, string | number> = {
      query: titulo,
      language: "es-AR",
      region: "AR",
    };

    // Si tenemos el año exacto, lo usamos como filtro directo en TMDB.
    // primary_release_year es más preciso que filtrar por margen de fechas,
	// luego se le aplicaran todos los filtros, pero lo mas probable es que haya devuelto solo 1 pelicula
    // es la única opción cuando el scrapper solo provee el año (ej: Lugones).
    if (anioLanzamiento) {
      params.primary_release_year = anioLanzamiento;
    }

    const response = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
        params,
      },
    );

    const resultados = response.data.results;
    tmdbLogger.resultadosBrutos(resultados.length);

    if (resultados.length === 0) return null;

    // 1. Normalizamos el título buscado para la comparación.( No es lo mismo que la limpieza que se hace en el adapter)
    const tituloBusquedaNorm = this.normalizarTitulo(titulo);

    // 2. Calculamos el score de similitud para cada resultado (contra title y original_title).
    const candidatosConScore: CandidatoConScore[] = resultados.map((p: any) => {
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
      const scoreElegido = Math.max(scoreTitulo, scoreOriginal);

      tmdbLogger.scoreComparacion(
        titulo,
        p.title,
        p.release_date,
        scoreTitulo,
        scoreOriginal,
        scoreElegido,
      );

      return { ...p, score: scoreElegido };
    });

    tmdbLogger.candidatosConScore(candidatosConScore);

    // 3. Filtramos por un umbral mínimo de similitud para evitar falsos positivos
    // (ej: si buscas "The Batman" y te devuelve "Batman" con score bajo).
    const candidatosValidos = candidatosConScore.filter(
      (p: CandidatoConScore) => p.score >= MIN_SIMILARITY_SCORE,
    );

    tmdbLogger.candidatosValidos(
      candidatosValidos.length,
      candidatosConScore.length,
      MIN_SIMILARITY_SCORE,
    );

    if (candidatosValidos.length === 0) {
      tmdbLogger.sinCandidatosValidos(titulo);
      console.warn(
        `⚠️ No se encontró una coincidencia con similitud suficiente para: "${titulo}"`,
      );
      return null;
    }

    // 4. De los válidos, filtramos por fecha si existe (teniendo en cuenta el margen definido).
    const candidatosPorFecha = fechaLanzamiento
      ? this.filtrarPorFecha(candidatosValidos, fechaLanzamiento)
      : candidatosValidos;

    if (fechaLanzamiento) {
      tmdbLogger.filtroPorFecha(
        candidatosPorFecha.length,
        candidatosValidos.length,
        CUATRO_MESES_DIAS,
      );
    }

    // 5. Si el filtro de fecha dejó candidatos, vamos con esos, si no, con los validos.
    // Dentro de ese grupo, elegimos el de mayor score de similitud.
    // Si hay empate en similitud (max 0.15 de diferencia), caemos en popularidad.
    const pool =
      candidatosPorFecha.length > 0 ? candidatosPorFecha : candidatosValidos;

    // Ordenamos primero por score (descendente)
    const ahora = Date.now();
    const ganador = pool.sort((a: CandidatoConScore, b: CandidatoConScore) => {
      if (Math.abs(b.score - a.score) > 0.15) {
        tmdbLogger.comparacion(
          a,
          b,
          "score",
          b.score > a.score ? b.title : a.title,
        );
        return b.score - a.score; //si hay una diferencia grande de score, directamente devolvemos el de mayor score
      }
      // si el score es cercano, priorizamos la peli con fecha dentro del margen
      //importante para remakes que se estrenan en cines de los que no me traigo la fecha
      const cercanoA = a.release_date
        ? Math.abs(new Date(a.release_date).getTime() - ahora) <= MARGEN_FECHA
        : false;
      const cercanoB = b.release_date
        ? Math.abs(new Date(b.release_date).getTime() - ahora) <= MARGEN_FECHA
        : false;

      if (cercanoA !== cercanoB) {
        const ganadorFecha = cercanoA ? a.title : b.title;
        tmdbLogger.comparacion(a, b, "fecha", ganadorFecha);
        return cercanoA ? -1 : 1; //-1=> a es mayor, 1=> b es mayor
      }

      // si ambos estan dentro o fuera del margen, desempato por popularidad
      tmdbLogger.comparacion(
        a,
        b,
        "popularidad",
        b.popularity > a.popularity ? b.title : a.title,
      );
      return b.popularity - a.popularity;
    })[0];

    tmdbLogger.ganador(ganador);

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

  private filtrarPorFecha(resultados: any[], fechaLanzamiento: Date): any[] {
    return resultados.filter((p) => {
      if (!p.release_date) return false;
      const diff = Math.abs(
        new Date(p.release_date).getTime() - fechaLanzamiento.getTime(),
      );
      return diff <= MARGEN_FECHA; //solo me quedo con los que difieran menos del margen
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
