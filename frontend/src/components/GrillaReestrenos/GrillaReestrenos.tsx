"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Categoria } from "@/types/api";
import type { PaginatedResult, OrdenPeliculas } from "@/types/api";
import type { Pelicula, Cine, Localidad } from "@/types/pelicula";
import { usePeliculasPaginadas } from "@/hooks/usePeliculasPaginadas";
import { peliculaService } from "@/services/peliculaService";
import PeliculaCard from "@/components/Pelicula/PeliculaCard";
import PeliculaModal from "@/components/Pelicula/PeliculaModal";

interface GrillaReestrenosProps {
  initialData?: PaginatedResult<Pelicula>;
  initialCines?: Cine[];
}

const LOCALIDADES: { valor: Localidad; label: string }[] = [
  { valor: "CABA", label: "CABA" },
  { valor: "GBA_ZONA_NORTE", label: "Zona Norte" },
  { valor: "GBA_ZONA_SUR", label: "Zona Sur" },
  { valor: "GBA_ZONA_OESTE", label: "Zona Oeste" },
  { valor: "GBA_ZONA_ESTE", label: "Zona Este" },
];

// Coincide con el orden por defecto de la API, así la primera página del SSR ya viene ordenada
const ORDEN_POR_DEFECTO: OrdenPeliculas = "proxima";

const ORDENES: { valor: OrdenPeliculas; label: string }[] = [
  { valor: "proxima", label: "Próxima función" },
  { valor: "popularidad", label: "Popularidad" },
];

export default function GrillaReestrenos({
  initialData,
  initialCines = [],
}: GrillaReestrenosProps) {
  const [localidad, setLocalidad] = useState<Localidad | undefined>(undefined);
  const [tempLocalidad, setTempLocalidad] = useState<Localidad | undefined>(undefined);
  const [orden, setOrden] = useState<OrdenPeliculas>(ORDEN_POR_DEFECTO);
  const [cineIds, setCineIds] = useState<number[]>([]);
  const [tempOrden, setTempOrden] = useState<OrdenPeliculas>(ORDEN_POR_DEFECTO);
  const [tempCineIds, setTempCineIds] = useState<number[]>([]);
  const [cines, setCines] = useState<Cine[]>(initialCines);
  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState<Pelicula | null>(null);

  // Zonas con cines disponibles (usa la lista de cines si cargó, o fallback a las zonas activas conocidas)
  const zonasConCines = new Set<Localidad>(
    cines.length > 0
      ? (cines.map((c) => c.localidad).filter(Boolean) as Localidad[])
      : (["CABA", "GBA_ZONA_NORTE", "GBA_ZONA_SUR"] as Localidad[]),
  );

  // Sentinel para el IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { peliculas, hasMore, cargando, error, cargarMas } = usePeliculasPaginadas(
    Categoria.REESTRENOS,
    initialData,
    orden,
    cineIds,
    localidad,
  );

  // Carga la lista de cines si no vinieron por SSR
  useEffect(() => {
    if (initialCines.length === 0) {
      peliculaService
        .getCines()
        .then(setCines)
        .catch(() => {
          // Si falla, simplemente no mostramos el filtro de cines
          setCines([]);
        });
    }
  }, [initialCines.length]);

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

  const handleLocalidad = useCallback((valor: Localidad) => {
    if (!zonasConCines.has(valor)) return;
    setTempLocalidad((prev) => {
      const nueva = prev === valor ? undefined : valor;
      // Se deseleccionan los cines elegidos que no pertenecen a la nueva localidad
      if (nueva) {
        setTempCineIds((ids) =>
          ids.filter((id) => {
            const cine = cines.find((c) => c.id === id);
            return !cine?.localidad || cine.localidad === nueva;
          }),
        );
      }
      return nueva;
    });
  }, [cines, zonasConCines]);

  // Siempre hay un orden elegido: no se deselecciona
  const handleOrden = useCallback((valor: OrdenPeliculas) => {
    setTempOrden(valor);
  }, []);

  // Se pueden elegir varios cines: cada clic agrega o saca el cine de la selección
  const handleCine = useCallback((id: number) => {
    setTempCineIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id].sort((a, b) => a - b),
    );
  }, []);

  const handleAplicar = useCallback(() => {
    setLocalidad(tempLocalidad);
    setOrden(tempOrden);
    setCineIds(tempCineIds);
  }, [tempLocalidad, tempOrden, tempCineIds]);

  const handleLimpiar = useCallback(() => {
    setTempLocalidad(undefined);
    setTempOrden(ORDEN_POR_DEFECTO);
    setTempCineIds([]);
    setLocalidad(undefined);
    setOrden(ORDEN_POR_DEFECTO);
    setCineIds([]);
  }, []);

  // Las selecciones de cines se guardan ordenadas, así que alcanza con comparar el join
  const hayCambiosPendientes =
    tempLocalidad !== localidad ||
    tempOrden !== orden ||
    tempCineIds.join(",") !== cineIds.join(",");

  const cinesFiltrados = tempLocalidad
    ? cines.filter((c) => c.localidad === tempLocalidad)
    : cines;

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
        <div className="flex flex-col gap-5">
          {/* Fila 1 — Zona / Localidad */}
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white/30 mb-2">Zona</p>
            <div className="flex flex-wrap gap-2">
              {LOCALIDADES.map(({ valor, label }) => {
                const sinCines = !zonasConCines.has(valor);
                return (
                  <button
                    key={valor}
                    disabled={sinCines}
                    onClick={() => handleLocalidad(valor)}
                    aria-pressed={tempLocalidad === valor}
                    title={sinCines ? "Próximamente disponible" : undefined}
                    className={[
                      "inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full border transition-all duration-200",
                      "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                      sinCines
                        ? "bg-white/5 border-white/10 text-white/35 cursor-not-allowed"
                        : tempLocalidad === valor
                          ? "bg-accent border-accent text-bg-base scale-105 shadow-[0_0_15px_rgba(167,139,250,0.4)] cursor-pointer"
                          : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40 hover:text-white shadow-sm cursor-pointer",
                    ].join(" ")}
                  >
                    <span>{label}</span>
                    {sinCines && (
                      <span className="text-xxs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                        Próximamente
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 2 — Cines */}
          {cinesFiltrados.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-white/30 mb-2">Cine</p>
              <div className="flex flex-wrap gap-2">
                {cinesFiltrados.map((cine) => (
                  <button
                    key={cine.id}
                    onClick={() => handleCine(cine.id)}
                    aria-pressed={tempCineIds.includes(cine.id)}
                    className={[
                      "px-4 py-1.5 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer",
                      "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                      tempCineIds.includes(cine.id)
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

          {/* Fila 3 — Orden */}
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white/30 mb-2">Orden</p>
            <div className="flex flex-wrap gap-2">
              {ORDENES.map(({ valor, label }) => (
                <button
                  key={valor}
                  onClick={() => handleOrden(valor)}
                  aria-pressed={tempOrden === valor}
                  className={[
                    "px-4 py-1.5 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer",
                    "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                    tempOrden === valor
                      ? "bg-accent border-accent text-bg-base scale-105 shadow-[0_0_15px_rgba(167,139,250,0.4)]"
                      : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40 hover:text-white shadow-sm",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones de filtro */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleAplicar}
              disabled={!hayCambiosPendientes}
              className={[
                "px-5 py-2 text-sm font-bold rounded-full transition-all duration-200 cursor-pointer",
                hayCambiosPendientes
                  ? "bg-violet-900 text-white hover:bg-violet-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] scale-105"
                  : "bg-white/10 text-white/40 cursor-not-allowed",
              ].join(" ")}
            >
              Aplicar
            </button>

            {(tempOrden !== ORDEN_POR_DEFECTO ||
              tempCineIds.length > 0 ||
              tempLocalidad !== undefined ||
              orden !== ORDEN_POR_DEFECTO ||
              cineIds.length > 0 ||
              localidad !== undefined) && (
              <button
                onClick={handleLimpiar}
                className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Grilla ─────────────────────────────────────────── */}
      {peliculas.length === 0 && !cargando ? (
        <div className="px-[5%] text-white/40 text-base py-16 text-center">
          {localidad && !zonasConCines.has(localidad)
            ? "Próximamente sumaremos cines y funciones para esta zona."
            : "No hay películas disponibles con los filtros seleccionados."}
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
