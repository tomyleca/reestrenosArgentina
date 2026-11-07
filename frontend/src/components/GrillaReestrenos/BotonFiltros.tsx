interface BotonFiltrosProps {
  abierto: boolean;
  cantidadActivos: number;
  panelId: string;
  onToggle: () => void;
}

// Botón que despliega el panel de filtros en pantallas chicas.
// En desktop (md+) los filtros están siempre visibles, así que se oculta.
export default function BotonFiltros({
  abierto,
  cantidadActivos,
  panelId,
  onToggle,
}: BotonFiltrosProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={abierto}
      aria-controls={panelId}
      className={[
        "md:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 cursor-pointer",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
        abierto
          ? "bg-white/20 border-white/40 text-white"
          : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:border-white/40",
      ].join(" ")}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v1.38a1.5 1.5 0 0 1-.44 1.06L12 11.5v4.38a1 1 0 0 1-1.45.9l-2-1A1 1 0 0 1 8 14.88V11.5L3.44 6.94A1.5 1.5 0 0 1 3 5.88V4.5Z" />
      </svg>
      Filtros
      {cantidadActivos > 0 && (
        <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-accent text-bg-base text-xs font-bold">
          {cantidadActivos}
        </span>
      )}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
      >
        <path
          fillRule="evenodd"
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
