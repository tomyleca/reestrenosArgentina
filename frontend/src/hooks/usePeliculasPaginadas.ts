import { useState, useCallback, useRef } from "react";
import type { Pelicula } from "@/types/pelicula";
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
//Es un custom hook, no un context, por lo que cada vez que es llamado se crea una nueva instancia
//Si fuese un context tendria un provider
export function usePeliculasPaginadas(
  categoria: Categoria,
  initialData?: PaginatedResult<Pelicula>,
  periodo?: FiltroPeriodo,
  cineId?: number,
): UsePeliculasPaginadasResult {
  const [peliculas, setPeliculas] = useState<Pelicula[]>(initialData?.data || []);
  const [page, setPage] = useState(initialData ? 2 : 1); //arranca en 2 pq la 1 se carga como SSR
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevPeriodoRef = useRef<FiltroPeriodo | undefined>(periodo);
  const prevCineIdRef = useRef<number | undefined>(cineId);

  // Evita doble fetch si el componente renderiza dos veces (StrictMode)
  const cargandoRef = useRef(false);
  // Registra qué páginas ya fueron cargadas para no repetir
  const paginasCargadasRef = useRef(new Set<number>(initialData ? [1] : []));

  const fetchPagina = useCallback(
    async (paginaACargar: number, forceLimpiar = false) => {
      if (cargandoRef.current) return;
      if (!forceLimpiar && paginasCargadasRef.current.has(paginaACargar)) return;

      cargandoRef.current = true;
      setCargando(true);
      setError(null);

      try {
        const fetcher =
          categoria === Categoria.ESTRENOS
            ? peliculaService.getEstrenosPaginados
            : peliculaService.getReestrenosPaginados;

        const resultado = await fetcher({ page: paginaACargar, limit: LIMIT, periodo, cineId });

        if (forceLimpiar) {
          paginasCargadasRef.current = new Set([paginaACargar]);
          setPeliculas(resultado.data);
        } else {
          paginasCargadasRef.current.add(paginaACargar);
          setPeliculas((prev) => {
            const idsExistentes = new Set(prev.map((p) => p.id));
            return [...prev, ...resultado.data.filter((p) => !idsExistentes.has(p.id))];
          });
        }
        setHasMore(resultado.hasMore);
        setPage(paginaACargar + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar películas");
      } finally {
        cargandoRef.current = false;
        setCargando(false);
      }
    },
    [categoria, periodo, cineId],
  );

  // Carga la primera página al montar — solo una vez si no vino en initialData
  const inicializadoRef = useRef(false);
  if (!inicializadoRef.current) {
    inicializadoRef.current = true;
    if (!initialData) {
      // Diferimos con setTimeout 0 para que React no se queje de side-effects en render
      setTimeout(() => fetchPagina(1), 0);
    }
  }

  // Detectar cambio de filtros (periodo o cineId)
  if (prevPeriodoRef.current !== periodo || prevCineIdRef.current !== cineId) {
    prevPeriodoRef.current = periodo;
    prevCineIdRef.current = cineId;
    // Disparamos la carga de la página 1 limpiando lo anterior
    setTimeout(() => fetchPagina(1, true), 0);
  }

  const cargarMas = useCallback(() => {
    if (!hasMore || cargando) return;
    void fetchPagina(page);
  }, [hasMore, cargando, fetchPagina, page]);

  return { peliculas, hasMore, cargando, error, cargarMas };
}
