import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_APP_URL || "http://localhost:3001"),
  title: {
    default: "Cartelera Cine Argentino | Todas las Películas",
    template: "%s | Cartelera Cine Argentino",
  },
  description: "Descubrí todas las películas en cartelera en los cines de Argentina. Horarios, salas y estrenos actualizados.",
  keywords: ["cine argentino", "cartelera", "películas", "estrenos", "Argentina", "horarios cine"],
  authors: [{ name: "Cartelera Cine Argentino" }],
  creator: "Cartelera Cine Argentino",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    title: "Cartelera Cine Argentino | Todas las Películas",
    description: "La guía definitiva para ver cine en Argentina. Buscá tu película favorita y encontrá dónde verla.",
    siteName: "Cartelera Cine Argentino",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cartelera Cine Argentino",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartelera Cine Argentino",
    description: "Películas en cartelera en los cines de Argentina.",
    images: ["/og-image.jpg"],
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
