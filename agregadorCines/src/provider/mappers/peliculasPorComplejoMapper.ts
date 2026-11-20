import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";
import {
  calendarioArgentina,
  fechaArgentina,
} from "../../utils/fechasArgentina.js";

// Respuesta de /Funciones/GetPeliculasPorComplejo, el endpoint de la plataforma
// de venta que usan Cines Pixel y Atlas: una entrada por película con su
// próxima función, y los datos de la película en cachePeliculas.
export interface PeliculaPorComplejoItem {
  fecha?: string | null; // día de la próxima función ("2026-11-20T00:00:00")
  cachePeliculas?: {
    titulo?: string | null;
    tituloOriginal?: string | null;
  } | null;
}

export interface OpcionesMapper {
  // Prefijos que el cine pone en el título para marcar un ciclo o festival
  // (Atlas: "BARS:EL CRIADERO" es una película del festival Rojo Sangre)
  ciclosPorPrefijo?: Record<string, string>;
  ahora?: Date;
}

// La plataforma corta los títulos en 30 caracteres ("JUEGOS DEL HAMBRE:AMANECER
// EN"). Uno que llega al tope, ya sin espacios finales, casi seguro está cortado.
const LARGO_TITULO_CORTADO = 29;

// La API también lista preventas con su primera función semanas adelante
// (ej. "AVENGERS: DOOMSDAY" con función el 16/12). En cartelera cuenta solo lo
// que tiene función en los próximos días.
const DIAS_EN_CARTELERA = 7;

export function peliculasPorComplejoMapper(
  responseJson: PeliculaPorComplejoItem[],
  cine: Cine,
  opciones: OpcionesMapper = {},
): PeliculaInput[] {
  // Si la API cambia de formato se devuelve vacío: el provider pasa al scraper
  if (!Array.isArray(responseJson)) return [];

  const limite = finDeLaCartelera(opciones.ahora ?? new Date());
  const vistos = new Set<string>();
  const peliculas: PeliculaInput[] = [];

  for (const item of responseJson) {
    if (esPreventa(item?.fecha, limite)) continue;

    const tituloLocal = item?.cachePeliculas?.titulo?.trim();
    if (!tituloLocal) continue;

    const prefijo = Object.keys(opciones.ciclosPorPrefijo ?? {}).find((p) =>
      tituloLocal.toUpperCase().startsWith(p.toUpperCase()),
    );
    const ciclo = prefijo ? opciones.ciclosPorPrefijo![prefijo] : undefined;
    const sinPrefijo = prefijo
      ? tituloLocal.slice(prefijo.length).trim()
      : tituloLocal;

    // El título original es contexto para el desambiguador cuando el título
    // local es ambiguo (ej. "ANIQUILACION" es "Onslaught", no "Annihilation").
    // No se usa `estreno`: es la fecha en que la película llegó a este cine, y
    // en un reestreno apuntaría al año equivocado.
    const tituloOriginal = item.cachePeliculas?.tituloOriginal?.trim();
    // Un título cortado no se encuentra en TMDB: se busca por el original
    const cortado = tituloLocal.length >= LARGO_TITULO_CORTADO;
    const titulo = cortado && tituloOriginal ? tituloOriginal : sinPrefijo;
    if (!titulo) continue;

    const clave = titulo.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    const otroTitulo = titulo === tituloOriginal ? sinPrefijo : tituloOriginal;
    const aportaContexto =
      otroTitulo && otroTitulo.toLowerCase() !== clave;

    peliculas.push({
      titulo,
      cine,
      ...(ciclo ? { ciclo } : {}),
      ...(aportaContexto
        ? {
            textoRaw:
              titulo === tituloOriginal
                ? `Título en el cine: ${otroTitulo}`
                : `Título original: ${otroTitulo}`,
          }
        : {}),
    });
  }

  return peliculas;
}

// 00:00 del día siguiente al último día que cuenta como cartelera
function finDeLaCartelera(ahora: Date): Date {
  const { anio, mes, dia } = calendarioArgentina(ahora);
  return fechaArgentina(anio, mes, dia + DIAS_EN_CARTELERA + 1);
}

// La fecha viene como día de Argentina sin zona ("2026-12-16T00:00:00")
function esPreventa(fecha: string | null | undefined, limite: Date): boolean {
  const partes = fecha?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!partes) return false;
  const dia = fechaArgentina(
    Number(partes[1]),
    Number(partes[2]) - 1,
    Number(partes[3]),
  );
  return dia >= limite;
}
