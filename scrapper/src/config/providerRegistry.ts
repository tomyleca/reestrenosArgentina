import type { Page } from "playwright";
import type { Cine } from "../core/domain/cine.js";
import type { ICineProvider } from "../provider/ICineProvider.js";
import { CineApiRequester } from "../provider/cineApiRequester.js";
import { CinemarkScrapper } from "../provider/scrappers/cinemarkScrapper.js";
import { CinepolisScrapper } from "../provider/scrappers/cinepolisScrapper.js";
import { ApiWithFallbackProvider } from "../provider/apiWithFallbackProvider.js";
import { cinepolisApiMapper } from "../provider/mappers/cinepolisMapper.js";
import { cinemarkHoyts, cinepolis } from "./cinesConfig.js";
import { cinemarkApiMapper } from "../provider/mappers/cinemarkMapper.js";
import { ScraperOnlyProvider } from "../provider/scraperOnlyProvider.js";


type ProviderFactory = (
  cine: Cine,
  pageFactory: () => Promise<Page>,
) => ICineProvider;

export const providerRegistry = new Map<string, ProviderFactory>([
  [
    cinemarkHoyts.nombre,
    (cine, pageFactory) =>
      new ApiWithFallbackProvider(
        cine,
        new CineApiRequester(cine, cinemarkApiMapper),
        new CinemarkScrapper(cine),
        pageFactory,
      ),
  ],
  [
    cinepolis.nombre,
    (cine, pageFactory) =>
      new ScraperOnlyProvider(
		cine,
		 new CinepolisScrapper(cine), 
		 pageFactory
		),
  ],
]);
