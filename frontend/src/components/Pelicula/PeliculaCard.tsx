import Image from "next/image";
import type { Pelicula } from "@/types/pelicula";

interface PeliculaCardProps {
  pelicula: Pelicula;
  onClick: () => void;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

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

export default function PeliculaCard({ pelicula, onClick }: PeliculaCardProps) {
  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Ver detalles de ${pelicula.titulo}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        "relative flex-none w-full rounded-2xl overflow-hidden cursor-pointer",
        "transition-all duration-300 ease-out outline-none",
        "focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg-base",
        "card-shadow hover:-translate-y-2 hover:card-shadow-hover hover:scale-[1.03]",
      ].join(" ")}
    >
      {/* Poster */}
      <div className="aspect-2/3 relative">
        {pelicula.poster_path ? (
          <Image
            className="absolute inset-0 object-cover w-full h-full transition-transform duration-500"
            src={`${TMDB_IMAGE_BASE}${pelicula.poster_path}`}
            alt={`Poster de ${pelicula.titulo}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center placeholder-gradient text-5xl font-black tracking-tighter text-accent">
            {iniciales(pelicula.titulo)}
          </div>
        )}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent translate-y-1 transition-transform duration-300 hover:translate-y-0">
        <h3 className="text-sm font-bold text-white leading-snug mb-1.5 text-shadow">
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
      </div>
    </article>
  );
}
