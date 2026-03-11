"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Categoria, PaginatedResult } from "@/types/api";
import type { Pelicula } from "@/types/pelicula";
import { usePeliculasPaginadas } from "@/hooks/usePeliculasPaginadas";
import PeliculaCard from "./PeliculaCard";

interface CarruselPeliculasProps {
  categoria: Categoria;
  titulo?: string;
  initialData?: PaginatedResult<Pelicula>;
}

// w-250 = 250px, gap-5 = 20px
const CARD_WIDTH_PX = 250 + 20;
const CARDS_VISIBLES = 4;
// Cuántas cards antes del final se triggerean la carga de la próxima página
const UMBRAL_CARGA = 3;

export default function CarruselPeliculas({
  categoria,
  titulo = "En cartelera",
  initialData,
}: CarruselPeliculasProps) {
  const { peliculas, hasMore, cargando, error, cargarMas } =
    usePeliculasPaginadas(categoria, initialData);

  const [indexActivo, setIndexActivo] = useState(0);
  const [offset, setOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxOffset = Math.max(0, peliculas.length - CARDS_VISIBLES);

  // Cargar más cuando el índice activo está cerca del final
  useEffect(() => {
    if (peliculas.length === 0) return;
    if (indexActivo >= peliculas.length - UMBRAL_CARGA) {
      cargarMas();
    }
  }, [indexActivo, peliculas.length, cargarMas]);

  const irAnterior = useCallback(() => {
    setOffset((prev) => Math.max(0, prev - 1));
    setIndexActivo((prev) => Math.max(0, prev - 1));
  }, []);

  const irSiguiente = useCallback(() => {
    setOffset((prev) => Math.min(maxOffset, prev + 1));
    setIndexActivo((prev) => Math.min(peliculas.length - 1, prev + 1));
  }, [maxOffset, peliculas.length]);

  const hoverPelicula = useCallback((index: number) => {
    setIndexActivo(index);
  }, []);

  const translateX = -(offset * CARD_WIDTH_PX);

  if (error) {
    return (
      <section className="relative w-full py-8 pb-12 bg-linear-to-b from-bg-base to-bg-elevated">
        <div className="px-[5%] text-red-400 text-sm">
          Error al cargar {titulo}: {error}
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden py-8 pb-12 bg-linear-to-b from-bg-base to-bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-[5%] mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          <span className="text-accent">🎬</span> {titulo}
        </h2>
        {cargando && (
          <span className="text-xs text-white/40 animate-pulse">Cargando…</span>
        )}
      </div>

      {/* Track */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-5 px-[5%] transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX}px)` }}
        >
          {peliculas.map((pelicula, index) => (
            <PeliculaCard
              key={pelicula.id}
              pelicula={pelicula}
              activa={index === indexActivo}
              onMouseEnter={() => hoverPelicula(index)}
            />
          ))}
          {/* Skeleton de carga al final */}
          {cargando &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex-none w-[250px] h-[375px] rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={irAnterior}
          disabled={indexActivo === 0}
          aria-label="Película anterior"
          className="w-10 h-10 rounded-full border border-accent/40 bg-accent/8 text-accent text-lg flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:bg-accent/20 hover:border-accent/70 hover:scale-110 disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100"
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          {peliculas.map((_, index) => (
            <button
              key={index}
              onClick={() => hoverPelicula(index)}
              aria-label={`Ir a película ${index + 1}`}
              className={[
                "h-1.5 rounded-full border-none cursor-pointer p-0 transition-all duration-300",
                index === indexActivo ? "w-5 bg-accent" : "w-1.5 bg-white/20",
              ].join(" ")}
            />
          ))}
          {hasMore && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
          )}
        </div>

        <button
          onClick={irSiguiente}
          disabled={indexActivo === peliculas.length - 1 && !hasMore}
          aria-label="Película siguiente"
          className="w-10 h-10 rounded-full border border-accent/40 bg-accent/8 text-accent text-lg flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:bg-accent/20 hover:border-accent/70 hover:scale-110 disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100"
        >
          →
        </button>
      </div>
    </section>
  );
}

