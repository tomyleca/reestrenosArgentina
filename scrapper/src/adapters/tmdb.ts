import "dotenv/config";
import axios from "axios";
import type { TMDBPeliculaDetalleDTO } from "../core/dtos/tmdbPeliculaDetalleDTO.js";

export class TMDB {
  async buscarPeliculaId(titulo: string): Promise<number | null> {
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

    // TMDB puede devolver varias películas que coincidan con el título.
    // Elegimos la de mayor popularidad para reducir falsos positivos.
	//TODO mejorar este algoritmo
    if (response.data.results.length > 0) {
      // reduce recorre el array comparando de a pares (prev vs curr)
      // y se queda con el que tiene mayor popularity.
      // Al terminar, mas_popular es el objeto ganador de toda la lista.
      const mas_popular = response.data.results.reduce(
        (
          prev: { id: number; popularity: number },
          curr: { id: number; popularity: number },
        ) => (curr.popularity > prev.popularity ? curr : prev),
      );
      return mas_popular.id;
    }
    return null;
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
