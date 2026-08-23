import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import GrillaReestrenos from "@/components/GrillaReestrenos/GrillaReestrenos";
import { peliculaService } from "@/services/peliculaService";
import { getCloudinaryFolderImages } from "@/services/cloudinaryService";
import styles from "./page.module.css";

export default async function Home() {
  // SSR: Traemos la 1ra página de reestrenos desde el servidor antes de mandar el HTML al cliente
  // Esto hace que el primer renderizado ya tenga las películas (mejor carga inicial y SEO)
  const [initialReestrenos, cloudinaryImages] = await Promise.all([
    peliculaService.getReestrenosPaginados({ page: 1, limit: 25 }),
    getCloudinaryFolderImages("agregadorCines"),
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
      <GrillaReestrenos initialData={initialReestrenos} />
    </main>
  );
}
