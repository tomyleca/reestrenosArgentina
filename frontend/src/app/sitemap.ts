import { MetadataRoute } from 'next';
import { peliculaService } from '@/services/peliculaService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'http://localhost:3001';

  // Buscamos todas las películas para generar rutas dinámicas
  // Nota: Podríamos necesitar un método para obtener TODAS las películas sin paginación si la lista crece,
  // pero por ahora traemos un número razonable de ambas categorías.
  const [estrenos, reestrenos] = await Promise.all([
    peliculaService.getEstrenosPaginados({ limit: 100 }),
    peliculaService.getReestrenosPaginados({ limit: 100 }),
  ]);

  const allPeliculas = [...estrenos.data, ...reestrenos.data];
  
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
