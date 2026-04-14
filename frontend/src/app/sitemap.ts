import { MetadataRoute } from 'next';
import { peliculaService } from '@/services/peliculaService';
import type { Pelicula } from '@/types/pelicula';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_APP_URL || "http://localhost:3001";

  let uniquePeliculas: Pelicula[] = [];

  try {
    // Buscamos todas las películas para generar rutas dinámicas
    const [estrenos, reestrenos] = await Promise.all([
      peliculaService.getEstrenosPaginados({ limit: 100 }),
      peliculaService.getReestrenosPaginados({ limit: 100 }),
    ]);

    const allPeliculas = [...estrenos.data, ...reestrenos.data];

    // Eliminamos duplicados por ID
    uniquePeliculas = Array.from(new Map(allPeliculas.map(p => [p.id, p])).values());
  } catch {
    // Si la API no está disponible durante el build, generamos el sitemap sin las rutas de películas
    console.warn("⚠️ No se pudo conectar a la API para generar el sitemap. Se generará sin rutas de películas.");
  }

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
