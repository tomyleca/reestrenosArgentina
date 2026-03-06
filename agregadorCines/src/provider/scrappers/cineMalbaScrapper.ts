import type { Cine } from "../../core/domain/cine.js";
import { CicloScrapper } from "../cicloScrapper.js";
import type { Page } from "playwright";

export class CineMalbaScrapper extends CicloScrapper {
  public override cine: Cine;

  constructor(cine: Cine) {
    super();
    this.cine = cine;
  }

  protected override async prepararPagina(page: Page): Promise<void> {
    // Espera para Cloudflare y carga de contenido
    await page.waitForTimeout(3000);
    // Scroll para asegurar carga de elementos dinámicos 
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
  }
}
