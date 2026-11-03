import { MetadataRoute } from 'next';
import { peliculaService } from '@/services/peliculaService';
import type { Pelicula } from '@/types/pelicula';
import type { GetPeliculasParams, PaginatedResult } from '@/types/api';

// Máximo que acepta la API por página; pedir más devuelve 400
const LIMIT_API = 50;
// Tope de seguridad para no quedar en un loop si la API devolviera hasMore siempre
const MAX_PAGINAS = 20;

// Recorre todas las páginas de un listado
async function traerTodas(
  fetcher: (params: GetPeliculasParams) => Promise<PaginatedResult<Pelicula>>,
): Promise<Pelicula[]> {
  const peliculas: Pelicula[] = [];
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const resultado = await fetcher({ page, limit: LIMIT_API });
    peliculas.push(...resultado.data);
    if (!resultado.hasMore) break;
  }
  return peliculas;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_APP_URL || "http://localhost:3001";

  // Buscamos todas las películas para generar rutas dinámicas.
  // Sin try/catch a propósito: el sitemap es estático, y uno sin películas quedaría
  // guardado una hora. Si la API falla, el build falla o se sigue sirviendo el último bueno.
  const [estrenos, reestrenos] = await Promise.all([
    traerTodas(peliculaService.getEstrenosPaginados),
    traerTodas(peliculaService.getReestrenosPaginados),
  ]);

  const allPeliculas = [...estrenos, ...reestrenos];

  // Eliminamos duplicados por ID
  const uniquePeliculas = Array.from(new Map(allPeliculas.map(p => [p.id, p])).values());

  //De esta forma el Googlebot puede entrar a las rutas de cada pelicula y, de esta forma, generar la metadata correspondiente a cada una.
  const movieUrls = uniquePeliculas.map((pelicula) => ({
    url: `${baseUrl}/pelicula/${pelicula.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...movieUrls,
  ];
}
