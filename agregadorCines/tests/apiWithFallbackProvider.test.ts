import { describe, it, expect, vi, afterEach } from "vitest";
import type { Page } from "playwright";
import { ApiWithFallbackProvider } from "../src/provider/apiWithFallbackProvider.js";
import { CineApiRequester } from "../src/provider/cineApiRequester.js";
import type { Scraper } from "../src/provider/scraper.js";
import type { Cine } from "../src/core/domain/cine.js";
import type { PeliculaInput } from "../src/core/dtos/peliculaInput.js";

const cine: Cine = {
  id: 1,
  nombre: "Cine Test",
  localidad: "CABA",
  url: "https://cine.test",
  api_url: "https://api.cine.test/peliculas",
  tieneFunciones: false,
};

const deApi: PeliculaInput[] = [{ titulo: "Desde la API", cine }];
const deScraper: PeliculaInput[] = [{ titulo: "Desde el scraper", cine }];

// Dobles mínimos: el provider solo usa requester.obtenerPeliculas,
// scraper.ejecutar y page.close
function crearProvider(
  obtenerDeApi: () => Promise<PeliculaInput[]>,
  ejecutarScraper: () => Promise<PeliculaInput[]> = async () => deScraper,
) {
  const page = { close: vi.fn(async () => {}) };
  const scraper = { ejecutar: vi.fn(ejecutarScraper) };
  const pageFactory = vi.fn(async () => page as unknown as Page);
  const provider = new ApiWithFallbackProvider(
    cine,
    { obtenerPeliculas: obtenerDeApi },
    scraper as unknown as Scraper,
    pageFactory,
  );
  return { provider, page, scraper, pageFactory };
}

describe("ApiWithFallbackProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa la API y no abre el navegador si trae películas", async () => {
    const { provider, scraper, pageFactory } = crearProvider(async () => deApi);

    expect(await provider.obtenerPeliculas()).toEqual(deApi);
    expect(scraper.ejecutar).not.toHaveBeenCalled();
    expect(pageFactory).not.toHaveBeenCalled();
  });

  it("usa el scraper si la API responde vacía", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { provider, page } = crearProvider(async () => []);

    expect(await provider.obtenerPeliculas()).toEqual(deScraper);
    expect(page.close).toHaveBeenCalledOnce();
  });

  it("usa el scraper si la API falla, y cierra la página", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { provider, page } = crearProvider(async () => {
      throw new Error("HTTP 500");
    });

    expect(await provider.obtenerPeliculas()).toEqual(deScraper);
    expect(page.close).toHaveBeenCalledOnce();
  });

  it("cierra la página aunque el scraper falle, y propaga el error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { provider, page } = crearProvider(
      async () => [],
      async () => {
        throw new Error("selector roto");
      },
    );

    await expect(provider.obtenerPeliculas()).rejects.toThrow("selector roto");
    expect(page.close).toHaveBeenCalledOnce();
  });
});

describe("CineApiRequester", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("corta con un error claro si la API no responde a tiempo", async () => {
    // fetch que nunca responde, salvo que lo aborte el signal
    vi.stubGlobal(
      "fetch",
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );
    const requester = new CineApiRequester(cine, () => deApi, 20);

    await expect(requester.obtenerPeliculas()).rejects.toThrow(
      `Timeout de 0.02s al consultar ${cine.api_url}`,
    );
  });

  it("mapea la respuesta cuando la API responde bien", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ data: ["x"] }), { status: 200 }),
    );
    const mapper = vi.fn(() => deApi);
    const requester = new CineApiRequester(cine, mapper);

    expect(await requester.obtenerPeliculas()).toEqual(deApi);
    expect(mapper).toHaveBeenCalledWith({ data: ["x"] }, cine);
  });

  describe("reintentos", () => {
    const ok = () => new Response(JSON.stringify({}), { status: 200 });
    const conEstado = (status: number) => new Response("", { status });

    // Sin espera entre intentos para que los tests no tarden
    function crearRequester(respuestas: Array<() => Response>) {
      const fetchMock = vi.fn(async () => {
        const siguiente = respuestas.shift();
        if (!siguiente) throw new Error("fetch llamado de más");
        return siguiente();
      });
      vi.stubGlobal("fetch", fetchMock);
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const requester = new CineApiRequester(cine, () => deApi, 1000, 0);
      return { requester, fetchMock };
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reintenta ante un 500 y devuelve las películas cuando la API se recupera", async () => {
      const { requester, fetchMock } = crearRequester([() => conEstado(500), ok]);

      expect(await requester.obtenerPeliculas()).toEqual(deApi);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("reintenta ante un corte de red", async () => {
      const { requester, fetchMock } = crearRequester([
        () => {
          throw new TypeError("fetch failed");
        },
        ok,
      ]);

      expect(await requester.obtenerPeliculas()).toEqual(deApi);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("se rinde después de tres intentos si el 500 persiste", async () => {
      const { requester, fetchMock } = crearRequester([
        () => conEstado(500),
        () => conEstado(500),
        () => conEstado(500),
      ]);

      await expect(requester.obtenerPeliculas()).rejects.toThrow(
        `HTTP 500 al consultar ${cine.api_url}`,
      );
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("no reintenta un 404", async () => {
      const { requester, fetchMock } = crearRequester([() => conEstado(404)]);

      await expect(requester.obtenerPeliculas()).rejects.toThrow("HTTP 404");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
