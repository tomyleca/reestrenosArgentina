import { Scraper } from "../scraper.js";
import type { Page } from 'playwright';
import type { Cine } from "../../core/domain/cine.js";

// Tope de clics en "Ver más" por si el botón nunca desapareciera
const MAX_CLICS_VER_MAS = 10;

export class CinemarkScrapper extends Scraper {
	cine: Cine;
	
	constructor(cine: Cine) {
		super();
		this.cine = cine;
	}

	async prepararPagina(page: Page): Promise<void> {
	if(!this.cine.selectors) {
		throw new Error(`No se han definido los selectores para el cine ${this.cine.nombre}`);
	}

		const nombreBoton = this.cine.selectors.nombreBoton;
		if (!nombreBoton) throw new Error("No se ha definido el nombre del botón para ver más películas en los selectores del cine.");
		
		const isVisible = await page.getByRole('button', { name: nombreBoton }).isVisible();
		if (isVisible) {
			await page.getByRole('button', { name: nombreBoton }).click();
			await page.getByRole('button', { name: 'Acepto' }).click();
			
			try {
				await page.waitForSelector('#gpt-home-modal', { state: 'attached', timeout: 3000 });
				
				
				await page.evaluate(() => {
					const modal = document.getElementById('gpt-home-modal');
					const backdrops = document.querySelectorAll('.MuiBackdrop-root'); // El fondo oscuro
					
					if (modal) modal.remove();
					backdrops.forEach(b => (b as HTMLElement).remove());
					
					// MUY IMPORTANTE: React/MUI suelen bloquear el scroll del body
					document.body.style.overflow = 'auto';
					document.body.style.pointerEvents = 'auto';
				});
				
				console.log("Modal de publicidad removido exitosamente.");
				} catch (e) {
				// Si no aparece el modal, no pasa nada, seguimos
				console.log("No apareció modal después del clic.");
				}

				// El botón desaparece cuando ya se ven todas las películas, así que se
				// sigue tocando solo mientras exista. Antes se tocaba una vez más sin
				// mirar: si el primer clic ya había cargado todo, esperaba 30 s un botón
				// que no estaba y el scraper entero fallaba.
				const botonVerMas = page.getByRole('button', { name: nombreBoton });
				for (let i = 0; i < MAX_CLICS_VER_MAS && (await botonVerMas.isVisible()); i++) {
					// Si el botón se va justo antes del clic no hay nada más que cargar
					const tocado = await botonVerMas
						.click({ timeout: 5000 })
						.then(() => true)
						.catch(() => false);
					if (!tocado) break;
					await page.waitForTimeout(2000); //cambiar por un wait for selector
				}
			}
		
	}




}