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

    if (response.data.results.length > 0) {
      return response.data.results[0].id;
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
