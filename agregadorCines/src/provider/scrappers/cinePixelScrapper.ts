import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import { Scraper } from "../scraper.js";

export class CinePixelScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
  }
}
