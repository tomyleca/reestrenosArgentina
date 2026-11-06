import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import GrillaReestrenos from "@/components/GrillaReestrenos/GrillaReestrenos";
import { peliculaService } from "@/services/peliculaService";
import { getCloudinaryFolderImages } from "@/services/cloudinaryService";
import { ORDEN_POR_DEFECTO } from "@/types/api";
import styles from "./page.module.css";

export default async function Home() {
  // SSR: Traemos la 1ra página de reestrenos desde el servidor antes de mandar el HTML al cliente
  // Esto hace que el primer renderizado ya tenga las películas (mejor carga inicial y SEO)
  // Los errores de la API no se atrapan a propósito: la home es estática, y si se armara
  // vacía quedaría guardada una hora. Si falla, el build falla (y sigue el deploy anterior)
  // o, al regenerar, Next sigue sirviendo la última versión buena.
  const [initialReestrenos, cloudinaryImages, initialCines] = await Promise.all([
    peliculaService.getReestrenosPaginados({ page: 1, limit: 25, orden: ORDEN_POR_DEFECTO }),
    getCloudinaryFolderImages("agregadorCines"),
    peliculaService.getCines(),
  ]);

  // Si Cloudinary no devuelve nada (ej: todavia no configuraste las keys), usamos estas de backup
  const fallbackImages = [
    "/hero/hero1.jpg",
    "/hero/hero2.jpg",
    "/hero/hero3.jpg",
  ];

  const heroImages = cloudinaryImages.length > 0 ? cloudinaryImages : fallbackImages;

  return (
    <main className={styles.main}>
      <HeroCarousel images={heroImages} />
      <GrillaReestrenos initialData={initialReestrenos} initialCines={initialCines} />
    </main>
  );
}
