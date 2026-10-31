import { useState, useCallback, useEffect, useRef } from "react";
import type { Pelicula, Localidad } from "@/types/pelicula";
import { Categoria, PaginatedResult, FiltroPeriodo } from "@/types/api";
import { peliculaService } from "@/services/peliculaService";

const LIMIT = 25;

interface UsePeliculasPaginadasResult {
  peliculas: Pelicula[];
  hasMore: boolean;
  cargando: boolean;
  error: string | null;
  cargarMas: () => void;
}

interface EstadoPaginacion {
  peliculas: Pelicula[];
  paginaSiguiente: number;
  hasMore: boolean;
  cargando: boolean;
  error: string | null;
}

//Es un custom hook, no un context, por lo que cada vez que es llamado se crea una nueva instancia
//Si fuese un context tendria un provider
export function usePeliculasPaginadas(
  categoria: Categoria,
  initialData?: PaginatedResult<Pelicula>,
  periodo?: FiltroPeriodo,
  cineId?: number,
  localidad?: Localidad,
): UsePeliculasPaginadasResult {
  const [estado, setEstado] = useState<EstadoPaginacion>(() => ({
    peliculas: initialData?.data ?? [],
    paginaSiguiente: initialData ? 2 : 1, //arranca en 2 pq la 1 se carga como SSR
    hasMore: initialData?.hasMore ?? true,
    cargando: false,
    error: null,
  }));

  // Request en curso. Cada carga nueva cancela la anterior: así una respuesta
  // de un filtro viejo (o de una página vieja) nunca pisa la del filtro actual.
  const requestRef = useRef<AbortController | null>(null);

  const cargarPagina = useCallback(
    async (pagina: number, reemplazar: boolean) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      setEstado((prev) => ({
        ...prev,
        cargando: true,
        error: null,
        // Al cambiar de filtro se vacía la grilla para no mostrar resultados viejos
        ...(reemplazar && { peliculas: [] }),
      }));

      try {
        const fetcher =
          categoria === Categoria.ESTRENOS
            ? peliculaService.getEstrenosPaginados
            : peliculaService.getReestrenosPaginados;

        const resultado = await fetcher(
          { page: pagina, limit: LIMIT, periodo, cineId, localidad },
          controller.signal,
        );
        if (controller.signal.aborted) return;

        setEstado((prev) => {
          const idsExistentes = new Set(prev.peliculas.map((p) => p.id));
          return {
            peliculas: reemplazar
              ? resultado.data
              : [...prev.peliculas, ...resultado.data.filter((p) => !idsExistentes.has(p.id))],
            paginaSiguiente: pagina + 1,
            hasMore: resultado.hasMore,
            cargando: false,
            error: null,
          };
        });
      } catch (e) {
        // Una request cancelada no es un error: ya hay otra en curso
        if (controller.signal.aborted) return;
        setEstado((prev) => ({
          ...prev,
          cargando: false,
          error: e instanceof Error ? e.message : "Error al cargar películas",
        }));
      }
    },
    [categoria, periodo, cineId, localidad],
  );

  // Filtros de la última carga de la página 1. Si vino initialData, esa carga
  // ya la hizo el servidor. Comparar la clave (en lugar de un flag) evita la
  // doble carga del doble efecto de StrictMode.
  const claveFiltros = `${categoria}|${periodo ?? ""}|${cineId ?? ""}|${localidad ?? ""}`;
  const claveCargadaRef = useRef<string | null>(initialData ? claveFiltros : null);

  useEffect(() => {
    if (claveCargadaRef.current === claveFiltros) return;
    claveCargadaRef.current = claveFiltros;
    void cargarPagina(1, true);
  }, [claveFiltros, cargarPagina]);

  const { hasMore, cargando, paginaSiguiente } = estado;
  const cargarMas = useCallback(() => {
    if (!hasMore || cargando) return;
    void cargarPagina(paginaSiguiente, false);
  }, [hasMore, cargando, paginaSiguiente, cargarPagina]);

  return {
    peliculas: estado.peliculas,
    hasMore: estado.hasMore,
    cargando: estado.cargando,
    error: estado.error,
    cargarMas,
  };
}
