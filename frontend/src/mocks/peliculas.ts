import type { Pelicula } from "@/types/pelicula";

export const PELICULAS_MOCK: Pelicula[] = [
  {
    id: 1,
    titulo: "Duna: Parte Dos",
    descripcion:
      "Paul Atreides se une a los Fremen y emprende un viaje espiritual y guerrero para vengar a su familia mientras intenta prevenir el terrible futuro que solo él puede prever.",
    generos: [
      { tmdbId: 878, nombre: "Ciencia ficción" },
      { tmdbId: 12, nombre: "Aventura" },
    ],
    duracionMinutos: 166,
    cines: [
      { id: 1, nombre: "Cinemark Palermo" },
      { id: 2, nombre: "Cinepolís Recoleta" },
    ],
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    popularidad: 385.4,
    fechaLanzamiento: "2024-03-01",
  },
  {
    id: 2,
    titulo: "Oppenheimer",
    descripcion:
      "La historia del físico teórico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.",
    generos: [
      { tmdbId: 18, nombre: "Drama" },
      { tmdbId: 36, nombre: "Historia" },
    ],
    duracionMinutos: 180,
    cines: [
      { id: 1, nombre: "Cinemark Palermo" },
      { id: 3, nombre: "Malba" },
    ],
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    popularidad: 290.1,
    fechaLanzamiento: "2023-07-21",
  },
  {
    id: 3,
    titulo: "La sociedad de la nieve",
    descripcion:
      "En 1972, un avión con 45 personas a bordo se estrella en los Andes. Los supervivientes de la tragedia deben enfrentar condiciones extremas durante 72 días.",
    generos: [
      { tmdbId: 18, nombre: "Drama" },
      { tmdbId: 12, nombre: "Aventura" },
    ],
    duracionMinutos: 144,
    cines: [{ id: 2, nombre: "Cinepolís Recoleta" }],
    poster_path: "/2e853FDVSIso600RqAMunJ7xdMG.jpg",
    popularidad: 176.8,
    fechaLanzamiento: "2024-01-04",
  },
  {
    id: 4,
    titulo: "Beetlejuice Beetlejuice",
    descripcion:
      "Lydia Deetz y su familia regresan a Winter River, donde el caótico y travieso fantasma Beetlejuice vuelve a aparecer en sus vidas.",
    generos: [
      { tmdbId: 35, nombre: "Comedia" },
      { tmdbId: 14, nombre: "Fantasía" },
    ],
    duracionMinutos: 104,
    cines: [
      { id: 1, nombre: "Cinemark Palermo" },
      { id: 2, nombre: "Cinepolís Recoleta" },
      { id: 4, nombre: "Hoyts Abasto" },
    ],
    poster_path: "/b5kXc1q1xZkCLQFLTPiXbWRfCqX.jpg",
    popularidad: 220.5,
    fechaLanzamiento: "2024-09-06",
  },
  {
    id: 5,
    titulo: "Alien: Romulus",
    descripcion:
      "Un grupo de jóvenes colonizadores del espacio se enfrentan cara a cara con la forma de vida más aterradora del universo mientras exploran una estación espacial abandonada.",
    generos: [
      { tmdbId: 27, nombre: "Terror" },
      { tmdbId: 878, nombre: "Ciencia ficción" },
    ],
    duracionMinutos: 119,
    cines: [
      { id: 1, nombre: "Cinemark Palermo" },
      { id: 4, nombre: "Hoyts Abasto" },
    ],
    poster_path: "/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
    popularidad: 198.3,
    fechaLanzamiento: "2024-08-16",
  },
];
