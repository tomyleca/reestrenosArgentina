import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { LEMA_SITIO, NOMBRE_SITIO } from "@/utils/sitio";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const TITULO = `${NOMBRE_SITIO} | ${LEMA_SITIO}`;
const DESCRIPCION =
  "Reestrenos y clásicos en los cines de CABA y el Gran Buenos Aires: qué se da, en qué cine y cuándo. Malba, Sala Lugones, Atlas, Cinemark y más.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_APP_URL || "http://localhost:3001"),
  applicationName: NOMBRE_SITIO,
  title: {
    default: TITULO,
    template: `%s | ${NOMBRE_SITIO}`,
  },
  description: DESCRIPCION,
  keywords: ["reestrenos", "reestrenos cine", "clásicos en cine", "cartelera", "cine Buenos Aires", "cine CABA", "ciclos de cine", "Argentina"],
  authors: [{ name: NOMBRE_SITIO }],
  creator: NOMBRE_SITIO,
  // Sin `alternates.canonical` acá: lo heredan todas las páginas, y con "/"
  // cada película se declaraba copia de la home. Cada página define el suyo.
  // La imagen para redes la genera app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: TITULO,
    description: DESCRIPCION,
    siteName: NOMBRE_SITIO,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" style={{ colorScheme: "dark" }}>
      <body className={inter.variable}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
