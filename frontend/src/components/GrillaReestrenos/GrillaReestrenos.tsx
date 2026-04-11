"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Categoria } from "@/types/api";
import type { PaginatedResult, FiltroPeriodo } from "@/types/api";
import type { Pelicula, Cine } from "@/types/pelicula";
import { usePeliculasPaginadas } from "@/hooks/usePeliculasPaginadas";
import { peliculaService } from "@/services/peliculaService";
import PeliculaCard from "@/components/CarruselPeliculas/PeliculaCard";
import PeliculaModal from "@/components/CarruselPeliculas/PeliculaModal";

interface GrillaReestrenosProps {
  initialData?: PaginatedResult<Pelicula>;
}

const PERIODOS: { valor: FiltroPeriodo; label: string }[] = [
  { valor: "hoy", label: "Hoy" },
  { valor: "semana", label: "Esta semana" },
  { valor: "mes", label: "Este mes" },
];

export default function GrillaReestrenos({ initialData }: GrillaReestrenosProps) {
  const [periodo, setPeriodo] = useState<FiltroPeriodo | undefined>(undefined);
  const [cineId, setCineId] = useState<number | undefined>(undefined);
  const [cines, setCines] = useState<Cine[]>([]);
  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState<Pelicula | null>(null);

  // Sentinel para el IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { peliculas, hasMore, cargando, error, cargarMas } = usePeliculasPaginadas(
    Categoria.REESTRENOS,
    initialData,
    periodo,
    cineId,
  );

  // Carga la lista de cines una sola vez al montar
  useEffect(() => {
    peliculaService
      .getCines()
      .then(setCines)
      .catch(() => {
        // Si falla, simplemente no mostramos el filtro de cines
        setCines([]);
      });
  }, []);

  // IntersectionObserver: cuando el sentinel es visible, carga más películas
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !cargando) {
          cargarMas();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, cargando, cargarMas]);

  const handlePeriodo = useCallback((valor: FiltroPeriodo) => {
    setPeriodo((prev) => (prev === valor ? undefined : valor));
  }, []);

  const handleCine = useCallback((id: number) => {
    setCineId((prev) => (prev === id ? undefined : id));
  }, []);

  if (error) {
    return (
      <section className="w-full py-8 px-[5%]">
        <p className="text-red-400 text-sm">Error al cargar reestrenos: {error}</p>
      </section>
    );
  }

  return (
    <section className="w-full py-10 bg-linear-to-b from-bg-base to-bg-elevated">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="px-[5%] mb-8">
      

        {/* Filtros */}
        <div className="flex flex-col gap-4">

          {/* Fila 1 — Cines */}
          {cines.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-white/30 mb-2">Cine</p>
              <div className="flex flex-wrap gap-2">
                {cines.map((cine) => (
                  <button
                    key={cine.id}
                    onClick={() => handleCine(cine.id)}
                    aria-pressed={cineId === cine.id}
                    className={[
                      "px-4 py-1.5 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer",
                      "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                      cineId === cine.id
                        ? "bg-accent border-accent text-bg-base scale-105 shadow-[0_0_15px_rgba(167,139,250,0.4)]"
                        : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40 hover:text-white shadow-sm",
                    ].join(" ")}
                  >
                    {cine.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fila 2 — Período */}
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white/30 mb-2">Cuando</p>
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map(({ valor, label }) => (
                <button
                  key={valor}
                  onClick={() => handlePeriodo(valor)}
                  aria-pressed={periodo === valor}
                  className={[
                    "px-4 py-1.5 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer",
                    "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                    periodo === valor
                      ? "bg-accent border-accent text-bg-base scale-105 shadow-[0_0_15px_rgba(167,139,250,0.4)]"
                      : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40 hover:text-white shadow-sm",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Limpiar filtros */}
          {(periodo || cineId) && (
            <button
              onClick={() => { setPeriodo(undefined); setCineId(undefined); }}
              className="self-start text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2 cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ─── Grilla ─────────────────────────────────────────── */}
      {peliculas.length === 0 && !cargando ? (
        <div className="px-[5%] text-white/40 text-base py-16 text-center">
          No hay películas disponibles con los filtros seleccionados.
        </div>
      ) : (
        <div className="px-[5%] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {peliculas.map((pelicula) => (
            <PeliculaCard
              key={pelicula.id}
              pelicula={pelicula}
              onClick={() => setPeliculaSeleccionada(pelicula)}
            />
          ))}

          {/* Skeletons durante la carga */}
          {cargando &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="aspect-2/3 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
        </div>
      )}

      {/* Sentinel para IntersectionObserver */}
      <div ref={sentinelRef} className="h-4 mt-8" aria-hidden />

      {/* Mensaje fin de lista */}
      {!hasMore && peliculas.length > 0 && (
        <p className="text-center text-xs text-white/25 mt-4 pb-8">
          No hay más películas
        </p>
      )}

      <PeliculaModal
        pelicula={peliculaSeleccionada}
        onClose={() => setPeliculaSeleccionada(null)}
      />
    </section>
  );
}
