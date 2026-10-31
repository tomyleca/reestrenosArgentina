// Todas las fechas de funciones se interpretan en hora de Argentina, sin importar
// la zona horaria del servidor (GitHub Actions y Vercel corren en UTC).
// Argentina no tiene horario de verano: es UTC-3 todo el año.
const OFFSET_ARGENTINA_HORAS = 3;
const OFFSET_ARGENTINA_MS = OFFSET_ARGENTINA_HORAS * 60 * 60 * 1000;

export interface FechaCalendario {
  anio: number;
  mes: number; // 0-11, igual que Date
  dia: number;
  diaSemana: number; // 0 = domingo
}

/**
 * Devuelve el instante que corresponde a una fecha y hora de Argentina.
 * Acepta valores fuera de rango igual que Date.UTC (ej. dia 32 → mes siguiente).
 */
export function fechaArgentina(
  anio: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
): Date {
  return new Date(
    Date.UTC(anio, mes, dia, hora + OFFSET_ARGENTINA_HORAS, minuto),
  );
}

/** Día de calendario en Argentina de un instante dado. */
export function calendarioArgentina(
  instante: Date = new Date(),
): FechaCalendario {
  const enArgentina = new Date(instante.getTime() - OFFSET_ARGENTINA_MS);
  return {
    anio: enArgentina.getUTCFullYear(),
    mes: enArgentina.getUTCMonth(),
    dia: enArgentina.getUTCDate(),
    diaSemana: enArgentina.getUTCDay(),
  };
}

/** Inicio del día (00:00 en Argentina) del instante dado. */
export function inicioDelDiaArgentina(instante: Date = new Date()): Date {
  const { anio, mes, dia } = calendarioArgentina(instante);
  return fechaArgentina(anio, mes, dia);
}
