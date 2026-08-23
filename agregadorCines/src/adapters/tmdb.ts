import "dotenv/config";
import axios from "axios";
import type { TMDBPeliculaDetalleDTO } from "../core/dtos/tmdbPeliculaDetalleDTO.js";
import type { PeliculaInput } from "../core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../core/dtos/candidatoPelicula.js";
import type { IDesambiguadorPelicula } from "../core/interfaces/IDesambiguadorPelicula.js";
import { DesambiguadorHibrido } from "./desambiguadores/desambiguadorHibrido.js";
import stringSimilarity from "string-similarity";
import { tmdbLogger } from "./tmdbLogger.js";

export class TMDB {
  private desambiguador: IDesambiguadorPelicula;

  constructor(desambiguador?: IDesambiguadorPelicula) {
    this.desambiguador = desambiguador || new DesambiguadorHibrido();
  }

  async buscarPeliculaId(
    peliculaInputOrTitulo: PeliculaInput | string,
    fechaLanzamiento?: Date,
    anioLanzamiento?: number,
  ): Promise<number | null> {
    let peliculaInput: PeliculaInput;
    if (typeof peliculaInputOrTitulo === "string") {
      peliculaInput = {
        titulo: peliculaInputOrTitulo,
        cine: { id: 0, nombre: "Desconocido", localidad: "CABA", url: "" },
      };
      if (fechaLanzamiento) peliculaInput.fechaLanzamiento = fechaLanzamiento;
      if (anioLanzamiento) peliculaInput.anioLanzamiento = anioLanzamiento;
    } else {
      peliculaInput = peliculaInputOrTitulo;
    }

    const titulo = peliculaInput.titulo;
    const fechaLanz = peliculaInput.fechaLanzamiento ?? fechaLanzamiento;
    const anioLanz = peliculaInput.anioLanzamiento ?? anioLanzamiento;

    tmdbLogger.busqueda(titulo, fechaLanz);

    const params: Record<string, string | number> = {
      query: titulo,
      language: "es-AR",
      region: "AR",
    };

    if (anioLanz) {
      params.primary_release_year = anioLanz;
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

    if (!resultados || resultados.length === 0) return null;

    // 1. Normalizamos el título buscado para la comparación.
    const tituloBusquedaNorm = this.normalizarTitulo(titulo);

    // 2. Calculamos el score de similitud para cada resultado (contra title, original_title, subcadenas y orden de relevancia de TMDB).
    const candidatosConScore: CandidatoPelicula[] = resultados.map((p: any, idx: number) => {
      const scoreTitulo = stringSimilarity.compareTwoStrings(
        tituloBusquedaNorm,
        this.normalizarTitulo(p.title),
      );

      const scoreOriginal = stringSimilarity.compareTwoStrings(
        tituloBusquedaNorm,
        this.normalizarTitulo(p.original_title),
      );

      let scoreElegido = Math.max(scoreTitulo, scoreOriginal);

      // Verificamos coincidencia de subcadenas (ej. "Se7en: Los siete pecados capitales")
      const normPTitle = this.normalizarTitulo(p.title);
      const normPOriginal = this.normalizarTitulo(p.original_title);

      if (
        (normPTitle.length > 3 && (tituloBusquedaNorm.includes(normPTitle) || normPTitle.includes(tituloBusquedaNorm))) ||
        (normPOriginal.length > 3 && (tituloBusquedaNorm.includes(normPOriginal) || normPOriginal.includes(tituloBusquedaNorm)))
      ) {
        scoreElegido = Math.max(scoreElegido, 0.7);
      }

      // Relevancia por ranking de búsqueda de TMDB:
      // La API de TMDB /search/movie incluye alias/traducciones en su motor de búsqueda.
      // Si TMDB ubica una película en las primeras posiciones para la query exacta, le asignamos un piso mínimo
      // para evitar descartarla por score 0.0 cuando el título difiere por traducción (ej. "Se7en" vs "Los siete pecados capitales").
      if (idx === 0) {
        scoreElegido = Math.max(scoreElegido, 0.35);
      } else if (idx < 3) {
        scoreElegido = Math.max(scoreElegido, 0.25);
      } else if (idx < 5) {
        scoreElegido = Math.max(scoreElegido, 0.15);
      }

      tmdbLogger.scoreComparacion(
        titulo,
        p.title,
        p.release_date,
        scoreTitulo,
        scoreOriginal,
        scoreElegido,
      );

      return {
        id: p.id,
        title: p.title,
        original_title: p.original_title,
        release_date: p.release_date,
        popularity: p.popularity,
        overview: p.overview,
        score: scoreElegido,
      };
    });

    tmdbLogger.candidatosConScore(candidatosConScore as any);

    // 3. Delegamos el desempate al strategy de desambiguación inyectado
    const ganador = await this.desambiguador.desempatar(
      peliculaInput,
      candidatosConScore,
    );

    return ganador ? ganador.id : null;
  }

  private normalizarTitulo(titulo: string): string {
    return titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9\s]/g, "") // Solo letras, números y espacios
      .trim();
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
