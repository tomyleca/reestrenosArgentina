import CarruselPeliculas from "@/components/CarruselPeliculas/CarruselPeliculas";
import { PELICULAS_MOCK } from "@/mocks/peliculas";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <CarruselPeliculas peliculas={PELICULAS_MOCK} titulo="En cartelera" />
    </main>
  );
}
