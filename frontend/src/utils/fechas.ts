// Las fechas de la API son instantes; siempre se muestran en hora de Argentina,
// sin importar la zona horaria del navegador o del servidor.
const ZONA_ARGENTINA = "America/Argentina/Buenos_Aires";

const formatoDia = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_ARGENTINA,
  weekday: "short",
  day: "numeric",
  month: "numeric",
});

const formatoHora = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_ARGENTINA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// "YYYY-MM-DD" del día en Argentina, para comparar días de calendario
const formatoClaveDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_ARGENTINA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Pasados estos días sin actualizarse, un cine se marca como desactualizado (el refresco es semanal). */
const DIAS_PARA_DESACTUALIZADO = 8;

/** "jue 30/10" */
export function formatearDia(fechaIso: string): string {
  const partes = Object.fromEntries(
    formatoDia.formatToParts(new Date(fechaIso)).map((p) => [p.type, p.value]),
  );
  return `${partes.weekday?.replace(".", "")} ${partes.day}/${partes.month}`;
}

/** "20:30", o null si la función no tiene horario (se guarda a las 00:00). */
export function formatearHora(fechaIso: string): string | null {
  const hora = formatoHora.format(new Date(fechaIso));
  return hora === "00:00" ? null : hora;
}

/** "jue 30/10" o "jue 30/10 · 20:30" */
export function formatearFuncion(fechaIso: string): string {
  const hora = formatearHora(fechaIso);
  return hora ? `${formatearDia(fechaIso)} · ${hora}` : formatearDia(fechaIso);
}

function diasDeCalendarioDesde(fechaIso: string, ahora: Date): number {
  const dia = (fecha: Date) => Date.parse(formatoClaveDia.format(fecha));
  return Math.round((dia(ahora) - dia(new Date(fechaIso))) / 86_400_000);
}

/** "hoy", "ayer" o "hace 5 días" */
export function tiempoDesde(fechaIso: string, ahora: Date = new Date()): string {
  const dias = diasDeCalendarioDesde(fechaIso, ahora);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

export function estaDesactualizado(
  fechaIso: string | null | undefined,
  ahora: Date = new Date(),
): boolean {
  if (!fechaIso) return true;
  return diasDeCalendarioDesde(fechaIso, ahora) > DIAS_PARA_DESACTUALIZADO;
}
