import CarruselPeliculas from "@/components/CarruselPeliculas/CarruselPeliculas";
import { Categoria } from "@/types/api";
import { peliculaService } from "@/services/peliculaService";
import styles from "./page.module.css";

export default async function Home() {
  // SSR: Traemos la 1ra página desde el servidor antes de mandar el HTML al cliente
  // Esto hace que el primer renderizado ya tenga las películas (mejor carga inicial y SEO)
  const [initialEstrenos, initialReestrenos] = await Promise.all([
    peliculaService.getEstrenosPaginados({ page: 1, limit: 10 }),
    peliculaService.getReestrenosPaginados({ page: 1, limit: 10 }),
  ]);

  return (
    <main className={styles.main}>
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

