"use client";

import { useState, useRef, useCallback } from "react";
import type { Pelicula } from "@/types/pelicula";
import PeliculaCard from "./PeliculaCard";

interface CarruselPeliculasProps {
  peliculas: Pelicula[];
  titulo?: string;
}

// w-64 = 256px, gap-5 = 20px
const CARD_WIDTH_PX = 256 + 20;
const CARDS_VISIBLES = 4;

export default function CarruselPeliculas({
  peliculas,
  titulo = "En cartelera",
}: CarruselPeliculasProps) {
  const [indexActivo, setIndexActivo] = useState(0);
  const [offset, setOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const maxOffset = Math.max(0, peliculas.length - CARDS_VISIBLES);

  const irAnterior = useCallback(() => {
    setOffset((prev) => Math.max(0, prev - 1));
    setIndexActivo((prev) => Math.max(0, prev - 1));
  }, []);

  const irSiguiente = useCallback(() => {
    setOffset((prev) => Math.min(maxOffset, prev + 1));
    setIndexActivo((prev) => Math.min(peliculas.length - 1, prev + 1));
  }, [maxOffset, peliculas.length]);

  const irAPelicula = useCallback(
    (index: number) => {
      setOffset(Math.min(maxOffset, Math.max(0, index - 1)));
      setIndexActivo(index);
    },
    [maxOffset]
  );

  const translateX = -(offset * CARD_WIDTH_PX);

  return (
    <section className="relative w-full overflow-hidden py-8 pb-12 bg-gradient-to-b from-bg-base to-bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-[5%] mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          <span className="text-accent">🎬</span> {titulo}
        </h2>
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
              onClick={() => irAPelicula(index)}
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
              onClick={() => irAPelicula(index)}
              aria-label={`Ir a película ${index + 1}`}
              className={[
                "h-1.5 rounded-full border-none cursor-pointer p-0 transition-all duration-300",
                index === indexActivo ? "w-5 bg-accent" : "w-1.5 bg-white/20",
              ].join(" ")}
            />
          ))}
        </div>

        <button
          onClick={irSiguiente}
          disabled={indexActivo === peliculas.length - 1}
          aria-label="Película siguiente"
          className="w-10 h-10 rounded-full border border-accent/40 bg-accent/8 text-accent text-lg flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:bg-accent/20 hover:border-accent/70 hover:scale-110 disabled:opacity-25 disabled:cursor-not-allowed disabled:scale-100"
        >
          →
        </button>
      </div>
    </section>
  );
}
