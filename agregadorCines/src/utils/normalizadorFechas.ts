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
   * Normaliza una fecha en formato texto (ej. "jueves 5", "Hoy", "5 de mayo") a un objeto Date.
   * Si no tiene año, asume el año actual o el siguiente si la fecha ya pasó por mucho.
   */
  public static normalizar(
    texto: string,
    fechaReferencia: Date = new Date(), //new Date te da el dia en el que estas
  ): Date | null {
    if (!texto) return null;

    const limpio = texto.
	
	toLowerCase().trim();

    // Casos especiales directos
    if (limpio === "hoy") return new Date(fechaReferencia);
    if (limpio === "mañana" || limpio === "manana") {
      const mañana = new Date(fechaReferencia);
      mañana.setDate(mañana.getDate() + 1);
      return mañana;
    }

    // Caso "jueves 5" o similar
    const diaNumMatch = limpio.match(/(\d+)/);
    if (diaNumMatch) {
      const diaNum = parseInt(diaNumMatch[1]!, 10);
      let mes = fechaReferencia.getMonth();
      let anio = fechaReferencia.getFullYear();

      const mesEncontrado = this.MESES.findIndex((m) => limpio.includes(m));
      if (mesEncontrado !== -1) {
        const resultado = new Date(anio, mesEncontrado, diaNum);
        // Si estamos a fin de año, asumimos año siguiente
        const esFinDeAnio = mes >= (12 - this.CANT_MESES_BUSCADOS); // Octubre = 9 en JS, DICIEMBRE =11	
        if (esFinDeAnio && mesEncontrado < mes) {
          resultado.setFullYear(anio + 1);
        }
        return resultado;
      } else {
        const diaSemanaIdx = this.DIAS_SEMANA.findIndex((d) =>
          limpio.includes(d),
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
          const testDate = new Date(anio, mes + i, diaNum);
          if (testDate.getDay() === diaSemanaNormalizado) {
            return testDate;
          }
        }
      }
    }

    //si no encontro nada es muy probable que la funcion corresponda al mes pasado
    return null;
  }
}
