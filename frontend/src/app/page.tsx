import CarruselPeliculas from "@/components/CarruselPeliculas/CarruselPeliculas";
import { Categoria } from "@/types/api";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <CarruselPeliculas categoria={Categoria.ESTRENOS} titulo="Estrenos" />
      <CarruselPeliculas categoria={Categoria.REESTRENOS} titulo="Reestrenos" />
    </main>
  );
}

