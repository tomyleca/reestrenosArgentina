import type { Cine } from "../../core/domain/cine.js";
import type { Page } from "playwright";
import { Scraper } from "../scraper.js";

export class CinepolisScrapper extends Scraper {
  cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    //Esperando a que carge página [CINEPOLIS]
	await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
  }
}
