export interface CandidatoPelicula {
  id: number;
  title: string;
  original_title: string;
  release_date?: string | null;
  popularity?: number;
  overview?: string;
  score: number;
}
