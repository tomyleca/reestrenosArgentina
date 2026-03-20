import CarruselPeliculas from "@/components/CarruselPeliculas/CarruselPeliculas";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import { Categoria } from "@/types/api";
import { peliculaService } from "@/services/peliculaService";
import { getCloudinaryFolderImages } from "@/services/cloudinaryService";
import styles from "./page.module.css";

export default async function Home() {
  // SSR: Traemos la 1ra página desde el servidor antes de mandar el HTML al cliente
  // Esto hace que el primer renderizado ya tenga las películas (mejor carga inicial y SEO)
  const [initialEstrenos, initialReestrenos, cloudinaryImages] = await Promise.all([
    peliculaService.getEstrenosPaginados({ page: 1, limit: 10 }),
    peliculaService.getReestrenosPaginados({ page: 1, limit: 10 }),
    getCloudinaryFolderImages("agregadorCines"), // Trae todo lo de la carpeta "agregadorCines"
  ]);

  // Si Cloudinary no devuelve nada (ej: todavia no configuraste las keys), usamos estas de backup
  const fallbackImages = [
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1312461204/horse.jpg",
  ];

  const heroImages = cloudinaryImages.length > 0 ? cloudinaryImages : fallbackImages;

  return (
    <main className={styles.main}>
      <HeroCarousel images={heroImages} />
      <CarruselPeliculas 
        categoria={Categoria.ESTRENOS} 
        titulo="Estrenos" 
        initialData={initialEstrenos}
      />
      <CarruselPeliculas 
        categoria={Categoria.REESTRENOS} 
        titulo="Reestrenos"
        initialData={initialReestrenos}
      />
    </main>
  );
}

