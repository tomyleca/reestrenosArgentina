import "dotenv/config";
import express from "express";
import cors from "cors";

import { PrismaCarteleraRepository } from "./repositories/carteleraRepository.js";
import { PeliculaController } from "./api/peliculaController.js";
import { crearPeliculaRouter } from "./api/peliculaRouter.js";

const carteleraRepository = new PrismaCarteleraRepository();

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
app.use(
  cors({
    origin: FRONTEND_URL,
  }),
);
app.use(express.json());

// La API no es para los buscadores: si Google la indexara, sus respuestas
// competirían con las páginas del sitio en los resultados.
app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex");
  next();
});

// API pública de películas
const peliculaController = new PeliculaController(carteleraRepository);
app.use("/", crearPeliculaRouter(peliculaController));

// Export for Vercel serverless
export default app;

// Fallback para desarrollo local si se ejecuta directamente
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, "0.0.0.0", () => {
    console.log("🌐 HTTP server escuchando en :3000 (Local Development)");
  });
}
