"use client";

import { useState } from "react";
import type { Cine, Funcion } from "@/types/pelicula";
import { estaDesactualizado, formatearFuncion, tiempoDesde } from "@/utils/fechas";

interface DisponibilidadCinesProps {
  cines: Cine[];
  funciones: Funcion[];
}

// Funciones visibles por cine antes de "Ver todas"
const FUNCIONES_VISIBLES = 6;

function getLocalidadLabel(localidad?: string): string | null {
  switch (localidad) {
    case "GBA_ZONA_NORTE":
      return "Zona Norte";
    case "GBA_ZONA_SUR":
    case "ZONA_SUR":
      return "Zona Sur";
    case "GBA_ZONA_OESTE":
      return "Zona Oeste";
    case "GBA_ZONA_ESTE":
      return "Zona Este";
    case "CABA":
      return "CABA";
    default:
      return null;
  }
}

function UltimaActualizacion({ fecha }: { fecha?: string | null | undefined }) {
  if (!fecha) {
    return <p className="text-xs text-amber-300/80">Sin datos de actualización</p>;
  }
  if (estaDesactualizado(fecha)) {
    return (
      <p className="text-xs text-amber-300/80">
        Actualizado {tiempoDesde(fecha)} · puede estar desactualizado
      </p>
    );
  }
  return <p className="text-xs text-white/50">Actualizado {tiempoDesde(fecha)}</p>;
}

function FuncionesDeCine({ cine, funciones }: { cine: Cine; funciones: Funcion[] }) {
  const [verTodas, setVerTodas] = useState(false);

  if (!cine.tieneFunciones) {
    return (
      <a
        href={cine.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-accent-light hover:text-white underline underline-offset-4 transition-colors"
      >
        Ver horarios en el sitio del cine
      </a>
    );
  }

  const visibles = verTodas ? funciones : funciones.slice(0, FUNCIONES_VISIBLES);
  const ocultas = funciones.length - visibles.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visibles.map((f) => (
        <time
          key={f.id}
          dateTime={f.fecha}
          className="px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent-light text-sm font-semibold capitalize"
        >
          {formatearFuncion(f.fecha)}
        </time>
      ))}
      {ocultas > 0 && (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          className="px-3 py-1 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-sm font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          +{ocultas} más
        </button>
      )}
    </div>
  );
}

export default function DisponibilidadCines({ cines, funciones }: DisponibilidadCinesProps) {
  if (cines.length === 0) {
    return <p className="text-white/50">No está en cartelera en este momento.</p>;
  }

  return (
    <ul className="flex flex-col gap-3 w-full text-left">
      {cines.map((cine) => {
        const locLabel = getLocalidadLabel(cine.localidad);
        return (
          <li
            key={cine.id}
            className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a
                href={cine.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white font-bold hover:text-accent-light transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                <span aria-hidden>📍</span> {cine.nombre}
                {locLabel && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-normal text-white/70">
                    {locLabel}
                  </span>
                )}
              </a>
              <UltimaActualizacion fecha={cine.ultimaActualizacion} />
            </div>
            <FuncionesDeCine
              cine={cine}
              funciones={funciones.filter((f) => f.cineId === cine.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
