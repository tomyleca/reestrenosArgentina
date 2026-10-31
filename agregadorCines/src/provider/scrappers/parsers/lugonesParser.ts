// Interpreta el texto de las páginas de ciclo (/produccion/...) del Complejo Teatral.
// El scraper solo extrae las líneas de cada <p>/<h4> de la página, en orden; acá
// se arman las funciones, así que se puede probar sin depender del sitio.

export interface FuncionLugones {
  titulo: string;
  fecha: string; // "<día> <hora>", lo interpreta NormalizadorFechas
  director?: string;
  anioLanzamiento?: number;
  textoRaw?: string; // ficha y créditos, contexto para el desambiguador IA
}

const DIA_SEMANA =
  "(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)";
const regexDia = new RegExp(`^${DIA_SEMANA}\\s+\\d+`, "i");
const regexHorarios = /^a las\s+(.+?)\s+horas?\.?$/i;
const regexFicha = /^\((.+)\)$/;

// "15 y 21" → ["15:00", "21:00"]; "14.30" → ["14:30"]
function parsearHoras(texto: string): string[] {
  return [...texto.matchAll(/(\d{1,2})(?:[.:](\d{2}))?/g)].map(
    (m) => `${m[1]}:${m[2] ?? "00"}`,
  );
}

function anioDeFicha(ficha: string): number | undefined {
  const anio = ficha.match(/(\d{4})\s*\)?\s*$/)?.[1];
  return anio ? parseInt(anio, 10) : undefined;
}

function directorDe(lineas: string[]): string | undefined {
  return lineas
    .find((l) => /^dirección:/i.test(l))
    ?.replace(/^dirección:\s*/i, "")
    .replace(/\.$/, "")
    .trim();
}

function funcion(
  titulo: string,
  fecha: string,
  director: string | undefined,
  anioLanzamiento: number | undefined,
  textoRaw: string | undefined,
): FuncionLugones {
  return {
    titulo,
    fecha,
    ...(director ? { director } : {}),
    ...(anioLanzamiento ? { anioLanzamiento } : {}),
    ...(textoRaw ? { textoRaw } : {}),
  };
}

/**
 * Ciclo con varias películas. Los párrafos vienen en secuencia:
 *   "Viernes 23"                         → día
 *   "A las 15 y 21 horas"                → horarios
 *   "El ángel de la calle                → película (formato actual): título en la
 *    (Street Angel; EE.UU; 1928)            primera línea y ficha en la segunda
 *    Dirección: Frank Borzage."
 * En el formato anterior la ficha va sola en un párrafo y el título en el anterior.
 * Devuelve una función por cada horario de cada película.
 */
export function parsearCiclo(bloques: string[][]): FuncionLugones[] {
  const funciones: FuncionLugones[] = [];
  let fechaActual: string | null = null;
  let horarios: string[] = [];
  let ultimoTexto: string | null = null;

  for (const lineas of bloques) {
    const primera = lineas[0];
    if (!primera) continue;

    if (regexDia.test(primera)) {
      fechaActual = primera;
      horarios = [];
      ultimoTexto = null;
      continue;
    }

    const matchHorarios = primera.match(regexHorarios);
    if (matchHorarios?.[1]) {
      horarios = parsearHoras(matchHorarios[1]);
      continue;
    }

    let titulo: string;
    let ficha: string;
    if (lineas[1] && regexFicha.test(lineas[1])) {
      titulo = primera;
      ficha = lineas[1];
    } else if (regexFicha.test(primera) && ultimoTexto) {
      titulo = ultimoTexto;
      ficha = primera;
    } else {
      ultimoTexto = primera;
      continue;
    }
    ultimoTexto = null;
    if (!fechaActual) continue;

    const director = directorDe(lineas);
    const anio = anioDeFicha(ficha);
    const textoRaw = [titulo, ...(lineas[0] === titulo ? lineas.slice(1) : lineas)].join(" ");
    const horariosFuncion = horarios.length > 0 ? horarios : [null];
    for (const horario of horariosFuncion) {
      funciones.push(
        funcion(
          titulo,
          horario ? `${fechaActual} ${horario}` : fechaActual,
          director,
          anio,
          textoRaw,
        ),
      );
    }
  }

  return funciones;
}

/**
 * Una línea de horarios de película única, con uno o más días y la hora al final:
 *   "Sábado 31 de octubre, 21 horas"
 *   "Viernes 20 y domingo 22 a las 21 horas"
 *   "Jueves 5, viernes 6 y sábado 7, 21 horas"
 * El mes suele aparecer solo en el último día ("viernes 20 y domingo 22 de
 * noviembre"): los días sin mes toman ese.
 */
export function parsearLineaHorarios(linea: string): string[] {
  const regexDiaConMes = new RegExp(
    `(${DIA_SEMANA})\\s+(\\d{1,2})°?(?:\\s+de\\s+([a-záéíóú]+))?`,
    "gi",
  );
  const dias = [...linea.matchAll(regexDiaConMes)];
  const ultimo = dias.at(-1);
  if (!ultimo || !/\bhoras?\b/i.test(linea)) return [];

  const horas = parsearHoras(linea.slice(ultimo.index + ultimo[0].length));
  if (horas.length === 0) return [];

  const mesComun = [...dias].reverse().find((d) => d[3])?.[3];
  return dias.flatMap((d) => {
    const mes = d[3] ?? mesComun;
    const dia = `${d[1]} ${d[2]}${mes ? ` de ${mes}` : ""}`;
    return horas.map((hora) => `${dia} ${hora}`);
  });
}

/**
 * Página de una sola película: el título es el h1 y los horarios están en líneas
 * sueltas (h4 o párrafos) con el formato de parsearLineaHorarios.
 */
export function parsearPeliculaUnica(
  titulo: string | undefined,
  bloques: string[][],
): FuncionLugones[] {
  if (!titulo) return [];
  const lineas = bloques.flat();

  const director = directorDe(lineas);
  // Ficha "Estados Unidos, 1974" o "Argentina – 2025"; las líneas que le siguen
  // (duración, formato, créditos) van como contexto para el desambiguador IA
  const indiceFicha = lineas.findIndex((l) => /^[^\d(]+[,–-]\s*\d{4}$/.test(l));
  const ficha = indiceFicha >= 0 ? lineas[indiceFicha] : undefined;
  const anio = ficha?.match(/(\d{4})$/)?.[1];
  const textoRaw = ficha
    ? lineas.slice(indiceFicha, indiceFicha + 6).join(" ")
    : undefined;

  const fechas = new Set(lineas.flatMap(parsearLineaHorarios));
  return [...fechas].map((fecha) =>
    funcion(titulo, fecha, director, anio ? parseInt(anio, 10) : undefined, textoRaw),
  );
}
