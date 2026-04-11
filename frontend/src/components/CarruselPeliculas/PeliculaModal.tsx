"use client";

import Image from "next/image";
import type { Pelicula } from "@/types/pelicula";
import { useEffect, useState } from "react";

interface PeliculaModalProps {
  pelicula: Pelicula | null;
  onClose: () => void;
}

const TMDB_IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/w780";

export default function PeliculaModal({ pelicula, onClose }: PeliculaModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (pelicula) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (pelicula) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pelicula, onClose]);

  if (!pelicula) return null;

  const handleCineClick = (_cineNombre: string, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all duration-500 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-black/40 rounded-3xl overflow-y-auto overflow-x-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-500 custom-scrollbar overscroll-contain">
        

        <div className="flex flex-col items-center p-8 lg:p-12 text-center">
          {/* Close Button */}
          <button 
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white text-xl transition-all hover:rotate-90 z-20 focus-visible:ring-2 focus-visible:ring-accent outline-none"
          >
            ✕
          </button>

          {/* 1. Poster at the top */}
          <div className="relative w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/5 mb-5 transform hover:scale-105 transition-transform duration-500">
            {pelicula.poster_path ? (
              <Image
                src={`${TMDB_IMAGE_BASE_ORIGINAL}${pelicula.poster_path}`}
                alt={pelicula.titulo}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5 text-accent text-4xl font-bold">
                {pelicula.titulo[0]}
              </div>
            )}
          </div>

          {/* 2. Title */}
          <h2 className="text-3xl lg:text-5xl font-black text-white mb-2 uppercase tracking-tighter leading-tight drop-shadow-lg">
            {pelicula.titulo}
          </h2>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {pelicula.generos.map((g) => (
              <span 
                key={g.tmdbId}
                className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent-light text-xs font-bold tracking-widest uppercase"
              >
                {g.nombre}
              </span>
            ))}

          </div>
		    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-bold mb-4">
              ⏱ {pelicula.duracionMinutos} MIN
            </span>

          {/* 3. Description */}
          <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-1" />
          
          <p className="text-base lg:text-lg text-white/70 leading-relaxed mb-4 font-medium max-w-prose text-balance">
            {pelicula.descripcion}
          </p>

          <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-8" />

          {/* 4. Cinema Chips */}
          <div className="w-full text-left lg:text-center">
            <p className="text-xxs uppercase tracking-[0.3em] font-black text-white/30 mb-6 text-center">Disponible en</p>
            <div className="flex flex-wrap justify-center gap-4">
              {pelicula.cines.map((cine) => (
                <button
                  key={cine.id}
                  onClick={() => handleCineClick(cine.nombre, cine.url)}
                  aria-label={`Ver funciones en ${cine.nombre}`}
                  className="group relative px-6 py-3 rounded-full bg-white/5 hover:bg-accent border border-white/10 hover:border-accent transition-all duration-300 hover:scale-110 overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span className="relative z-10 text-white font-bold group-hover:text-black flex items-center gap-2">
                    <span className="text-lg">📍</span> {cine.nombre}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
