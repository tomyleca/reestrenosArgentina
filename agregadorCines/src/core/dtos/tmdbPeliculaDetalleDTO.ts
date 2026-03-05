export interface TMDBGeneroDTO {
  id: number;
  name: string;
}

export interface TMDBPeliculaDetalleDTO {
  id: number;
  title: string;
  overview: string;
  runtime: number;
  genres: TMDBGeneroDTO[];
  poster_path: string;
  popularity: number;
  release_date: string;
}
