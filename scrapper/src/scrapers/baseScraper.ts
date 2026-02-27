import type { Page } from 'playwright';
import type { PeliculaInput } from '../interfaces/peliculaInput.js';
import type { PeliculaSelectors } from '../interfaces/selectors.js';
import type { Cine } from '../interfaces/cine.js';

//Tener una clase base y heredar me sirve para manejar la distinta lógica de scrapear las páginas, por ejemplo un formulario de inicio.
export abstract class BaseScraper {
	abstract nombreCine: string;

  constructor(protected selectors: PeliculaSelectors) {}

  protected async scrapear(page: Page): Promise<PeliculaInput[]> {
    // Usamos los selectores del JSON para buscar en la página
    return await page.$$eval(this.selectors.containerPelicula, (elements, sel) => {
    //Devuelvo como peliculaInput
	return elements.map(el => ({
        titulo: el.querySelector(sel.titulo)?.textContent?.trim() || 'Sin título',
		cine: this.nombreCine // Usamos el nombre del cine heredado de la clase base
      }));
    }, this.selectors); // Pasamos los selectores al contexto del navegador
  }



}