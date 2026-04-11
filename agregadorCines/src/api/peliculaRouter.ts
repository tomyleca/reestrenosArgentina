import { Router } from "express";
import type { PeliculaController } from "./peliculaController.js";

export function crearPeliculaRouter(controller: PeliculaController): Router {
  const router = Router();

  // El orden importa: las rutas estáticas deben ir antes que la dinámica /:id
  router.get("/peliculas/estrenos", controller.getEstrenos);
  router.get("/peliculas/reestrenos", controller.getReestrenos);
  router.get("/peliculas/:id", controller.getPeliculaById);
  router.get("/cines", controller.getCines);

  return router;
}
