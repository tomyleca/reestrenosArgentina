import Image from "next/image";
import type { Pelicula } from "@/types/pelicula";

interface PeliculaCardProps {
  pelicula: Pelicula;
  activa: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function iniciales(titulo: string): string {
  return titulo
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatearDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function PeliculaCard({
  pelicula,
  activa,
  onMouseEnter,
  onClick,
}: PeliculaCardProps) {
  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Ver detalles de ${pelicula.titulo}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        "relative flex-none w-[250px] h-[375px] rounded-2xl overflow-hidden cursor-pointer",
        "transition-all duration-300 ease-out outline-none",
        "focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg-base",
        activa
          ? "opacity-100 scale-105 z-10 card-shadow-active"
          : "opacity-60 card-shadow",
        "hover:opacity-100 hover:-translate-y-2 hover:card-shadow-hover",
        activa ? "hover:scale-110 hover:-translate-y-1" : "hover:scale-105",
      ].join(" ")}
    >
      {/* Poster */}
      {pelicula.poster_path ? (
        <Image
          className="absolute inset-0 object-cover w-full h-full transition-transform duration-500"
          src={`${TMDB_IMAGE_BASE}${pelicula.poster_path}`}
          alt={`Poster de ${pelicula.titulo}`}
          fill
          sizes="250px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center placeholder-gradient text-5xl font-black tracking-tighter text-accent">
          {iniciales(pelicula.titulo)}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/95 via-black/50 to-transparent translate-y-1 transition-transform duration-300 hover:translate-y-0">
        <h3 className="text-base font-bold text-white leading-snug mb-1.5 text-shadow">
          {pelicula.titulo}
        </h3>

        {pelicula.generos.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {pelicula.generos.slice(0, 2).map((g) => (
              <span
                key={g.tmdbId}
                className="text-xxs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-accent-light bg-accent/15 border border-accent/30"
              >
                {g.nombre}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-white/60">
          <span>⏱ {formatearDuracion(pelicula.duracionMinutos)}</span>
          {pelicula.cines.length > 0 && (
            <span>
              📍 {pelicula.cines.length}{" "}
              {pelicula.cines.length === 1 ? "cine" : "cines"}
            </span>
          )}
        </div>

        <p
          className={[
            "text-xs text-white/70 leading-relaxed mt-2 overflow-hidden transition-all duration-300",
            activa ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          {pelicula.descripcion.slice(0, 120)}
          {pelicula.descripcion.length > 120 ? "…" : ""}
        </p>
      </div>
    </article>
  );
}
