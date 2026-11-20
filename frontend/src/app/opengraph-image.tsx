import { ImageResponse } from "next/og";
import { LEMA_SITIO, NOMBRE_SITIO } from "@/utils/sitio";

// Imagen que muestran WhatsApp, X, Facebook, etc. al compartir un link del sitio.
// Next la genera en el build y la publica en og:image; las páginas de película
// la reemplazan por su póster.
export const alt = `${NOMBRE_SITIO}: ${LEMA_SITIO}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1e1e2e 60%, #3b2f63 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 900, color: "#a78bfa", letterSpacing: -4 }}>
          {NOMBRE_SITIO}
        </div>
        <div style={{ fontSize: 44, marginTop: 24, color: "rgba(255,255,255,0.85)" }}>
          {LEMA_SITIO}
        </div>
        <div style={{ fontSize: 30, marginTop: 40, color: "rgba(255,255,255,0.55)" }}>
          Qué se da, en qué cine y cuándo
        </div>
      </div>
    ),
    size,
  );
}
