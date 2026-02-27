import type { Page } from 'playwright';
import type { PeliculaInput } from '../interfaces/peliculaInput.js';
import type { PeliculaSelectors } from '../interfaces/selectors.js';
import type { Cine } from '../interfaces/cine.js';

//Tener una clase base y heredar me sirve para manejar la distinta lógica de scrapear las páginas, por ejemplo un formulario de inicio.
//Además me permite aplicar un template method.
export abstract class BaseScraper {
  abstract cine: Cine; //se la pasan las clases hijas

  constructor() {}

  //template method
  public async ejecutar(page: Page): Promise<PeliculaInput[]> {
    await page.goto(this.cine.url, { 
		waitUntil: "domcontentloaded", // No espera a las imágenes ni trackers
  		timeout: 60000                 // Aumentamos a 60s por las dudas
	 });
    await this.prepararPagina(page); // Por si tengo que hacer algo antes de scrapear, como cerrar un popup 
    return await this.scrapear(page);
  }

  protected async prepararPagina(page: Page): Promise<void> {
    // Por defecto no hace nada, los hijos pueden sobrescribirlo
  }

  protected async scrapear(page: Page): Promise<PeliculaInput[]> {
    return await page.$$eval(
      this.cine.selectors.containerPelicula,
      (elements, { sel, cineNombre }) => {
        return elements.map(el => ({
          titulo: el.querySelector(sel.titulo)?.textContent?.trim() || 'Sin título',
          cine: cineNombre, // tengo que pasarlo como parametro pq eval se ejecuta en el navegador
        }));
      },
      { sel: this.cine.selectors, cineNombre: this.cine.nombre }); //Paso los parametros al eval  
  }
}