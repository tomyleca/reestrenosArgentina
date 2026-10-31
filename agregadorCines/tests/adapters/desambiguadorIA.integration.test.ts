import "dotenv/config";
import { describe, test, expect } from "vitest";
import { DesambiguadorIA } from "../../src/adapters/desambiguadores/desambiguadorIA.js";
import type { PeliculaInput } from "../../src/core/dtos/peliculaInput.js";
import type { CandidatoPelicula } from "../../src/core/dtos/candidatoPelicula.js";

describe("DesambiguadorIA (integración real)", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const desambiguador = new DesambiguadorIA(apiKey);
  const cineMock = { id: 1, nombre: "Sala Lugones", localidad: "CABA" as const, url: "" };

  //salteo si no tengo api key
  test.skipIf(!apiKey)(
    "desambigua correctamente entre la versión clásica de Nosferatu (1922) y el remake (2024)",
    async () => {
      const peliculaInput: PeliculaInput = {
        titulo: "Nosferatu",
        cine: cineMock,
        ciclo: "Expresionismo Alemán",
        director: "F.W. Murnau",
        textoRaw: "(Nosferatu, eine Symphonie des Grauens; Alemania, 1922)",
      };

      const candidatos: CandidatoPelicula[] = [
        {
          id: 653,
          title: "Nosferatu",
          original_title: "Nosferatu, eine Symphonie des Grauens",
          release_date: "1922-03-04",
          overview: "Película muda clásica dirigida por F. W. Murnau sobre el vampiro Conde Orlok.",
          score: 1.0,
          popularity: 30,
        },
        {
          id: 426063,
          title: "Nosferatu",
          original_title: "Nosferatu",
          release_date: "2024-12-25",
          overview: "Una historia gótica de obsesión entre una joven atormentada y el espantoso vampiro infatuado de ella, dirigida por Robert Eggers.",
          score: 1.0,
          popularity: 250,
        },
      ];

      const resultado = await desambiguador.desempatar(peliculaInput, candidatos);
      console.log("🎬 Resultado DesambiguadorIA:", resultado);
      expect(resultado?.id).toBe(653);
    },
  );
});
