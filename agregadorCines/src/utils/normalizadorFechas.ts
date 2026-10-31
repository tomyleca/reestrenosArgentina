import { calendarioArgentina, fechaArgentina } from "./fechasArgentina.js";

export class NormalizadorFechas {
	private static readonly CANT_MESES_BUSCADOS = 3;


  private static readonly DIAS_SEMANA = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "miércoles",
    "jueves",
    "viernes",
    "sabado",
    "sábado",
  ];

  private static readonly MESES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  /**
   * Normaliza una fecha en formato texto (ej. "jueves 5", "Hoy", "5 de mayo", "2026-10-31 17:30") a un objeto Date.
   * Si no tiene año, asume el año actual o el siguiente si la fecha ya pasó por mucho.
   * Las fechas se interpretan en hora de Argentina y se devuelven a las 00:00 de ese día
   * (ver utils/fechasArgentina.ts), sin importar la zona horaria del servidor.
   */
  public static normalizar(
    texto: string,
    fechaReferencia: Date = new Date(), //new Date te da el instante actual
  ): Date | null {
    if (!texto) return null;

    const limpio = texto.toLowerCase().trim();

    // Formato ISO "2026-10-31", con hora opcional "2026-10-31 17:30"
    // (ej. el atributo data-date de Lumiton). Va primero porque el resto de
    // los casos tomaría el año como número de día.
    const iso = limpio.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ t](\d{1,2}):(\d{2}))?/);
    if (iso) {
      return fechaArgentina(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        Number(iso[4] ?? 0),
        Number(iso[5] ?? 0),
      );
    }

    // Hora opcional "15:00" en cualquier parte del texto (ej. "viernes 23 15:00").
    // Se saca del texto para que sus números no se confundan con el día.
    const horaMatch = limpio.match(/(\d{1,2}):(\d{2})/);
    const hora = horaMatch ? Number(horaMatch[1]) : 0;
    const minuto = horaMatch ? Number(horaMatch[2]) : 0;
    const sinHora = horaMatch ? limpio.replace(horaMatch[0], " ").trim() : limpio;

    const { anio, mes, dia } = calendarioArgentina(fechaReferencia);

    // Casos especiales directos
    if (sinHora === "hoy") return fechaArgentina(anio, mes, dia, hora, minuto);
    if (sinHora === "mañana" || sinHora === "manana") {
      return fechaArgentina(anio, mes, dia + 1, hora, minuto);
    }

    // Caso "jueves 5" o similar
    const diaNumMatch = sinHora.match(/(\d+)/);
    if (diaNumMatch) {
      const diaNum = parseInt(diaNumMatch[1]!, 10);

      const mesEncontrado = this.MESES.findIndex((m) => sinHora.includes(m));
      if (mesEncontrado !== -1) {
        // Si estamos a fin de año, asumimos año siguiente
        const esFinDeAnio = mes >= (12 - this.CANT_MESES_BUSCADOS); // Octubre = 9 en JS, DICIEMBRE =11
        const anioResultado =
          esFinDeAnio && mesEncontrado < mes ? anio + 1 : anio;
        return fechaArgentina(anioResultado, mesEncontrado, diaNum, hora, minuto);
      } else {
        const diaSemanaIdx = this.DIAS_SEMANA.findIndex((d) =>
          sinHora.includes(d),
        );
        // Los días con acento se repiten en el array de dias de arriba
        // Array: [dom, lun, mar, mie, mié, jue, vie, sab, sáb]
        // Indices: 0, 1, 2, 3, 4, 5, 6, 7, 8
        // Valores:0, 1, 2, 3, 3, 4, 5, 6, 6
        const mapping = [0, 1, 2, 3, 3, 4, 5, 6, 6];
        const diaSemanaNormalizado =
          diaSemanaIdx !== -1 ? mapping[diaSemanaIdx]! : -1;

        // Si solo hay un numero, no se procesa
        if (diaSemanaNormalizado === -1) return null;

        // Probamos mes actual, siguiente y el que le sigue (máximo 3 meses)
        for (let i = 0; i < this.CANT_MESES_BUSCADOS; i++) {
          const testDate = fechaArgentina(anio, mes + i, diaNum, hora, minuto);
          const calendario = calendarioArgentina(testDate);
          // Si el mes no tiene ese día (ej. 31 en un mes de 30), Date.UTC lo pasa
          // al mes siguiente: lo descartamos para no devolver otro día.
          if (
            calendario.dia === diaNum &&
            calendario.diaSemana === diaSemanaNormalizado
          ) {
            return testDate;
          }
        }
      }
    }

    //si no encontro nada es muy probable que la funcion corresponda al mes pasado
    return null;
  }
}
