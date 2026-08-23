import pino from "pino";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Logger para el algoritmo de búsqueda de TMDB.
 *
 * Escribe simultáneamente en:
 *   - stdout: pretty-print con colores en dev, JSON en prod.
 *   - archivo: JSON estructurado en logs/tmdb.log (siempre).
 *
 * Nivel de log: controlado con LOG_LEVEL (default "info").
 * Para ver el detalle del algoritmo de búsqueda: LOG_LEVEL=debug
 */

const isDev = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL ?? "info";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Sube desde src/adapters hasta la raíz del proyecto
const LOG_FILE = path.resolve(__dirname, "../../logs/tmdb.log");

const transport = pino.transport({
  targets: [
    // stdout: pretty en dev, JSON en prod
    isDev
      ? {
          target: "pino-pretty",
          level: logLevel,
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,name",
            messageKey: "msg",
          },
        }
      : {
          target: "pino/file",
          level: logLevel,
          options: { destination: 1 }, // fd 1 = stdout
        },
    // archivo: siempre JSON
    {
      target: "pino/file",
      level: logLevel,
      options: {
        destination: LOG_FILE,
        mkdir: true, // crea logs/ si no existe
      },
    },
  ],
});

const baseLogger = pino({ level: logLevel, name: "tmdb" }, transport);

export interface CandidatoConScore {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  popularity: number;
  score: number;
}

function formatTitulo(titulo: string, releaseDate?: string): string {
  const anio = releaseDate ? new Date(releaseDate).getFullYear() : null;
  return anio ? `${titulo} (${anio})` : titulo;
}

let llamadasIACount = 0;
let peliculasProcesadasCount = 0;

export const tmdbLogger = {
  busqueda(titulo: string, fechaLanzamiento?: Date): void {
    baseLogger.debug(
      { titulo, fechaReferencia: fechaLanzamiento?.toISOString() ?? null },
      `Buscando: "${titulo}" | fecha referencia: ${fechaLanzamiento?.toISOString() ?? "sin fecha"}`,
    );
  },

  resultadosBrutos(cantidad: number): void {
    baseLogger.debug({ cantidad }, `Resultados crudos de la API: ${cantidad}`);
  },

  scoreComparacion(
    tituloBuscado: string,
    titulo: string,
    releaseDate: string | undefined,
    scoreTitulo: number,
    scoreOriginal: number,
    scoreElegido: number,
  ): void {
    baseLogger.debug(
      {
        tituloBuscado,
        titulo: formatTitulo(titulo, releaseDate),
        scoreTitulo: +scoreTitulo.toFixed(3),
        scoreOriginal: +scoreOriginal.toFixed(3),
        scoreElegido: +scoreElegido.toFixed(3),
      },
      `  Score "${formatTitulo(titulo, releaseDate)}" → title: ${scoreTitulo.toFixed(3)} | original: ${scoreOriginal.toFixed(3)} → elegido: ${scoreElegido.toFixed(3)}`,
    );
  },

  candidatosConScore(candidatos: CandidatoConScore[]): void {
    baseLogger.debug(
      {
        candidatos: candidatos.map((c) => ({
          titulo: formatTitulo(c.title, c.release_date),
          score: +c.score.toFixed(3),
          popularidad: +c.popularity.toFixed(1),
        })),
      },
      "Scores de similitud calculados",
    );
  },

  candidatosValidos(cantidad: number, total: number, minScore: number): void {
    baseLogger.debug(
      { validos: cantidad, total, minScore },
      `Candidatos válidos (score >= ${minScore}): ${cantidad} de ${total}`,
    );
  },

  sinCandidatosValidos(titulo: string): void {
    baseLogger.warn(
      { titulo },
      `Sin candidatos con score suficiente para: "${titulo}"`,
    );
  },

  filtroPorFecha(
    candidatosFiltrados: number,
    totalValidos: number,
    margenDias: number,
  ): void {
    const poolUsado =
      candidatosFiltrados > 0
        ? "candidatos dentro del margen"
        : "ninguno en margen → usando todos los válidos";
    baseLogger.debug(
      { candidatosFiltrados, totalValidos, margenDias },
      `Filtro por fecha (margen ±${margenDias} días): ${candidatosFiltrados} de ${totalValidos} → ${poolUsado}`,
    );
  },

  comparacion(
    a: CandidatoConScore,
    b: CandidatoConScore,
    razon: "score" | "fecha" | "popularidad",
    ganador: string,
  ): void {
    baseLogger.debug(
      {
        a: formatTitulo(a.title, a.release_date),
        b: formatTitulo(b.title, b.release_date),
        razon,
        ganador,
      },
      `"${formatTitulo(a.title, a.release_date)}" vs "${formatTitulo(b.title, b.release_date)}" → desempate por ${razon} → gana: ${ganador}`,
    );
  },

  ganador(candidato: CandidatoConScore): void {
    baseLogger.info(
      {
        titulo: formatTitulo(candidato.title, candidato.release_date),
        id: candidato.id,
        score: +candidato.score.toFixed(3),
        popularidad: +candidato.popularity.toFixed(1),
      },
      `Ganador: "${formatTitulo(candidato.title, candidato.release_date)}" (id: ${candidato.id})`,
    );
  },

  incrementarProcesadas(): void {
    peliculasProcesadasCount++;
  },

  invocacionIA(titulo: string, cine: string, candidatosCount: number): void {
    llamadasIACount++;
    baseLogger.debug(
      { titulo, cine, candidatosCount },
      `🤖 Invocando Gemini AI para desambiguar "${titulo}" en ${cine} (${candidatosCount} candidatos)`,
    );
  },

  ganadorIA(
    tituloBuscado: string,
    ganador: { id: number; title: string },
    razonamiento: string,
  ): void {
    baseLogger.info(
      { tituloBuscado, id: ganador.id, tituloGanador: ganador.title, razonamiento },
      `🤖 DesambiguadorIA eligió ID ${ganador.id} ("${ganador.title}") para "${tituloBuscado}". Razón: ${razonamiento}`,
    );
  },

  sinGanadorIA(tituloBuscado: string, razonamiento: string): void {
    baseLogger.info(
      { tituloBuscado, razonamiento },
      `🤖 DesambiguadorIA no eligió ningún candidato para "${tituloBuscado}". Razón: ${razonamiento}`,
    );
  },

  errorIA(tituloBuscado: string, error: unknown): void {
    baseLogger.error(
      { tituloBuscado, error: error instanceof Error ? error.message : error },
      `❌ Error en DesambiguadorIA para "${tituloBuscado}": ${error instanceof Error ? error.message : error}`,
    );
  },

  resumenIA(): void {
    const porcentaje =
      peliculasProcesadasCount > 0
        ? ((llamadasIACount / peliculasProcesadasCount) * 100).toFixed(1)
        : "0";
    baseLogger.info(
      { llamadasIA: llamadasIACount, peliculasProcesadas: peliculasProcesadasCount, porcentaje: `${porcentaje}%` },
      `📊 Resumen de desambiguación: Se invocó la IA ${llamadasIACount} veces de ${peliculasProcesadasCount} películas procesadas (${porcentaje}%).`,
    );
  },

  resetContadores(): void {
    llamadasIACount = 0;
    peliculasProcesadasCount = 0;
  },
};
