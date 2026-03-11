import { useState, useCallback, useRef } from "react";
import type { Pelicula } from "@/types/pelicula";
import { Categoria } from "@/types/api";
import { peliculaService } from "@/services/peliculaService";

const LIMIT = 10;

interface UsePeliculasPaginadasResult {
  peliculas: Pelicula[];
  hasMore: boolean;
  cargando: boolean;
  error: string | null;
  cargarMas: () => void;
}

export function usePeliculasPaginadas(
  categoria: Categoria,
): UsePeliculasPaginadasResult {
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evita doble fetch si el componente renderiza dos veces (StrictMode)
  const cargandoRef = useRef(false);
  // Registra qué páginas ya fueron cargadas para no repetir
  const paginasCargadasRef = useRef(new Set<number>());

  const fetchPagina = useCallback(
    async (paginaACargar: number) => {
      if (cargandoRef.current) return;
      if (paginasCargadasRef.current.has(paginaACargar)) return;

      cargandoRef.current = true;
      setCargando(true);
      setError(null);

      try {
        const fetcher =
          categoria === Categoria.ESTRENOS
            ? peliculaService.getEstrenosPaginados
            : peliculaService.getReestrenosPaginados;

        const resultado = await fetcher({ page: paginaACargar, limit: LIMIT });

        paginasCargadasRef.current.add(paginaACargar);
        setPeliculas((prev) => [...prev, ...resultado.data]);
        setHasMore(resultado.hasMore);
        setPage(paginaACargar + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar películas");
      } finally {
        cargandoRef.current = false;
        setCargando(false);
      }
    },
    [categoria],
  );

  // Carga la primera página al montar — solo una vez
  const inicializadoRef = useRef(false);
  if (!inicializadoRef.current) {
    inicializadoRef.current = true;
    // Diferimos con setTimeout 0 para que React no se queje de side-effects en render
    setTimeout(() => fetchPagina(1), 0);
  }

  const cargarMas = useCallback(() => {
    if (!hasMore || cargando) return;
    void fetchPagina(page);
  }, [hasMore, cargando, fetchPagina, page]);

  return { peliculas, hasMore, cargando, error, cargarMas };
}
