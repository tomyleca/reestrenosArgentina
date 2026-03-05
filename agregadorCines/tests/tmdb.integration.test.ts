import { describe, test, expect } from "vitest";
import { TMDB } from "../src/adapters/tmdb.js";

describe("TMDB (integración real)", () => {
  const tmdb = new TMDB();

  test("encuentra Inception y devuelve su id correcto", async () => {
    const id = await tmdb.buscarPeliculaId("Inception");
    console.log(`🎬 ID de Inception: ${id}`);
    expect(id).toBe(27205);
  });

  test("devuelve null para un título que no existe", async () => {
    const id = await tmdb.buscarPeliculaId("xyzpeliculainexistente12345");
    expect(id).toBeNull();
  });
});
