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
    default: "Cartelera Reestrenos Cine Argentino",
    template: "%s | Cartelera Reestrenos Cine Argentino",
  },
  description: "Descubrí todas las películas en cartelera en los cines de Argentina. Horarios, salas, estrenos y reestrenos actualizados.",
  keywords: ["cine argentino", "cartelera", "películas", "estrenos","reestrenos", "Argentina", "horarios cine"],
  authors: [{ name: "Cartelera Reestrenos Cine Argentino" }],
  creator: "Cartelera Reestrenos Cine Argentino",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    title: "Cartelera Reestrenos Cine Argentino ",
    description: "La guía definitiva para ver cine en Argentina. Buscá tu película favorita y encontrá dónde verla.",
    siteName: "Cartelera Reestrenos Cine Argentino",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cartelera Reestrenos Cine Argentino",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartelera Reestrenos Cine Argentino",
    description: "Reestrenos en cartelera en los cines de Argentina. Cuando y donde verlos.",
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
