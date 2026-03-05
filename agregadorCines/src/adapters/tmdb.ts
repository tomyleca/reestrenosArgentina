import "dotenv/config";
import axios from "axios";
import type { TMDBPeliculaDetalleDTO } from "../core/dtos/tmdbPeliculaDetalleDTO.js";


const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
let MARGEN_POPULARIDAD = SIETE_DIAS_MS;	


export class TMDB {
  async buscarPeliculaId(titulo: string, fechaLanzamiento?: Date): Promise<number | null> {
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

    // TMDB puede devolver varias películas que coincidan con el título.
	
    // Si tenemos fecha de lanzamiento, la usamos para filtrar con un margen
    // de 7 días antes de elegir por popularidad (reduce falsos positivos).
    // Si no, elegimos directamente por popularidad.
    //TODO mejorar este algoritmo
    if (resultados.length === 0) return null;

    const candidatos = fechaLanzamiento
      ? this.filtrarPorFecha(resultados, fechaLanzamiento)
      : resultados;

    // Si el filtro por fecha no devolvió resultados, caemos al pool completo
    const pool = candidatos.length > 0 ? candidatos : resultados;

    return this.getMasPopular(pool);
  }

  // reduce recorre el array comparando de a pares (prev vs curr)
  // y se queda con el que tiene mayor popularity.
  // Al terminar, mas_popular es el objeto ganador de toda la lista.
  private getMasPopular(resultados: { id: number; popularity: number }[]): number {
    return resultados.reduce(
      (prev, curr) => (curr.popularity > prev.popularity ? curr : prev),
    ).id;
  }

  private filtrarPorFecha(
    resultados: { release_date: string }[],
    fechaLanzamiento: Date,
  ): { release_date: string }[] {
    return resultados.filter((p) => {
      if (!p.release_date) return false;
      const diff = Math.abs(new Date(p.release_date).getTime() - fechaLanzamiento.getTime());
      return diff <= MARGEN_POPULARIDAD;
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
