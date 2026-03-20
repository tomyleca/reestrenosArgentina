"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface HeroCarouselProps {
  images: string[];
}

const INTERVAL_MS = 6000;

export default function HeroCarousel({ images }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = images.length;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index % total);
      setProgressKey((k) => k + 1);
    },
    [total],
  );

  const next = useCallback(() => {
    if (total === 0) return;
    goTo(activeIndex + 1);
  }, [activeIndex, goTo, total]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, next, total]);

  if (total === 0) return null;

  return (
    <section
      className="relative w-full h-[60vh] md:h-[70vh] min-h-[350px] md:min-h-[450px] max-h-[750px] overflow-hidden bg-bg-base"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Galería destacada"
      style={{ "--hero-interval": `${INTERVAL_MS}ms` } as React.CSSProperties}
    >
      {/* Background slides */}
      {images.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === activeIndex ? 1 : 0 }}
          aria-hidden
        >
          <div
            className={`absolute -inset-4 bg-cover bg-center transition-transform duration-8000 ${
              i === activeIndex ? "scale-100" : "scale-105"
            }`}
            style={{
              backgroundImage: `url(${url})`,
              filter: "brightness(0.5) blur(2px)",
            }}
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(10,10,15,0.2)_0%,rgba(10,10,15,0.6)_100%] after:absolute after:inset-0 after:bg-linear-to-t after:from-bg-base after:to-transparent after:opacity-40" />
        </div>
      ))}

      {/* Content — Branding + Indicadores */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5 gap-6">
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white m-0 drop-shadow-2xl">
          <span className="bg-linear-to-br from-accent to-accent-light bg-clip-text text-transparent">
            Cartelera
          </span>
          <br />
          Cine Argentino
        </h1>

        <p className="text-base md:text-lg lg:text-xl text-white/85 max-w-2xl leading-relaxed font-medium drop-shadow-lg">
          Todas las películas en cartelera de los cines argentinos, en un solo
          lugar. Estrenos, reestrenos y funciones especiales.
        </p>

        {/* Progress indicators container (absolute at bottom) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 w-full max-w-[250px] md:max-width-[400px] px-5 z-30">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`relative h-1 md:h-1.5 rounded-full bg-white/20 cursor-pointer overflow-hidden transition-all duration-500 ease-in-out py-2 bg-clip-content border-none p-0 ${
                i === activeIndex ? "flex-4" : "flex-1"
              }`}
            >
              <div
                key={`fill-${i}-${progressKey}`}
                className={`absolute inset-y-0 left-0 bg-accent rounded-full ${
                  i === activeIndex ? "animate-hero-progress" : i < activeIndex ? "w-full" : "w-0"
                }`}
                style={{
                  animationDuration: i === activeIndex ? `${INTERVAL_MS}ms` : "0s",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Blurred fade-out at the bottom for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 backdrop-blur-[2px] bg-linear-to-t from-bg-base to-transparent pointer-events-none z-20" />
    </section>
  );
}
