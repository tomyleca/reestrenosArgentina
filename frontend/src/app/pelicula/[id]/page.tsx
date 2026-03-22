import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { peliculaService } from "@/services/peliculaService";
import JsonLd from "@/components/JsonLd";

interface Props {
  params: Promise<{ id: string }>;
}

const TMDB_IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  try {
    const pelicula = await peliculaService.getPeliculaById(parseInt(id));
    
    return {
      title: pelicula.titulo,
      description: pelicula.descripcion.slice(0, 160),
      openGraph: {
        title: pelicula.titulo,
        description: pelicula.descripcion.slice(0, 160),
        images: pelicula.poster_path ? [`https://image.tmdb.org/t/p/w500${pelicula.poster_path}`] : [],
        type: "video.movie",
      },
    };
  } catch (error) {
    return {
      title: "Película no encontrada",
    };
  }
}

export default async function PeliculaPage({ params }: Props) {
  const { id } = await params;
  let pelicula;
  
  try {
    pelicula = await peliculaService.getPeliculaById(parseInt(id));
  } catch (error) {
    notFound();
  }

  // Estructura de datos para Google (Rich Snippets). 
  // Nota: Las 'keys' (name, description, etc.) deben mantenerse en inglés 
  // según el estándar internacional de Schema.org, aunque los 'values' estén en español.
  const movieSchema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": pelicula.titulo,
    "description": pelicula.descripcion,
    "image": pelicula.poster_path ? `${TMDB_IMAGE_BASE_ORIGINAL}${pelicula.poster_path}` : undefined,
    "genre": pelicula.generos.map(g => g.nombre),
  };

  // Según Schema.org, ScreeningEvent indica funciones en cines. 
  // Las 'keys' deben estar en inglés para que los buscadores las reconozcan.
  const screeningEvents = pelicula.cines.map(cine => ({
    "@context": "https://schema.org",
    "@type": "ScreeningEvent",
    "workPresented": {
      "@type": "Movie",
      "name": pelicula.titulo
    },
    "location": {
      "@type": "MovieTheater",
      "name": cine.nombre,
      "url": cine.url
    }
  }));

  return (
    <main className="min-h-screen bg-black text-white p-4 lg:p-12 relative overflow-hidden">
      <JsonLd data={movieSchema} />
      <JsonLd data={screeningEvents} />
      
      {/* Desenfoque de ambiente de fondo */}
      {pelicula.poster_path && (
        <div className="absolute inset-0 -z-10 opacity-30 blur-3xl scale-150">
           <Image
            src={`${TMDB_IMAGE_BASE_ORIGINAL}${pelicula.poster_path}`}
            alt=""
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-white/50 hover:text-white transition-colors py-2 px-4 rounded-full bg-white/5 border border-white/10"
        >
          ← Volver a la cartelera
        </Link>

        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Sección del Póster */}
          <div className="relative w-full md:w-80 aspect-2/3 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
            {pelicula.poster_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE_ORIGINAL}${pelicula.poster_path}`}
                alt={pelicula.titulo}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-accent text-6xl font-bold">
                {pelicula.titulo[0]}
              </div>
            )}
          </div>

          {/* Sección de Contenido */}
          <div className="flex-1">
            <h1 className="text-4xl lg:text-7xl font-black mb-4 uppercase tracking-tighter leading-none drop-shadow-2xl">
              {pelicula.titulo}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {pelicula.generos.map((g) => (
                <span 
                  key={g.tmdbId}
                  className="px-4 py-1.5 rounded-full bg-accent/20 border border-accent/20 text-accent-light text-sm font-bold tracking-widest uppercase"
                >
                  {g.nombre}
                </span>
              ))}
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm font-bold">
                ⏱ {pelicula.duracionMinutos} MIN
              </span>
            </div>

            <div className="w-full h-px bg-linear-to-r from-white/10 via-white/5 to-transparent mb-8" />
            
            <p className="text-xl lg:text-2xl text-white/70 leading-relaxed mb-12 font-medium text-balance">
              {pelicula.descripcion}
            </p>

            <div className="w-full h-px bg-linear-to-r from-white/10 via-white/5 to-transparent mb-8" />

            <section>
              <h2 className="text-xs uppercase tracking-[0.4em] font-black text-white/30 mb-8">Disponible en</h2>
              <div className="flex flex-wrap gap-4">
                {pelicula.cines.map((cine) => (
                  <a
                    key={cine.id}
                    href={cine.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-4 rounded-2xl bg-white/5 hover:bg-accent border border-white/10 hover:border-accent transition-all duration-500 hover:-translate-y-1 outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span className="relative z-10 text-white font-bold group-hover:text-black flex items-center gap-3 text-lg">
                      <span>📍</span> {cine.nombre}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
