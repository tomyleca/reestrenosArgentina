import type { Request, Response } from "express";
import { z } from "zod";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";
import { Categoria } from "../core/domain/categoria.js";

import { Localidad } from "../core/domain/localidad.js";

// SCHEMAS DE VALIDACIÓN
const PaginacionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(25),
  orden: z.enum(["proxima", "popularidad"]).default("popularidad"),
});

const QueryEstrenosSchema = PaginacionSchema;

const QueryReestrenosSchema = QueryEstrenosSchema.extend({
  periodo: z.enum(["hoy", "semana", "mes"]).nullable().catch(null),
  // Uno o varios cines: "?cineIds=1,3" (o "?cineIds=1&cineIds=3")
  cineIds: z
    .preprocess(
      (val) => (typeof val === "string" ? val.split(",").filter(Boolean) : val),
      z.array(z.coerce.number().int().positive()).max(50),
    )
    .optional(),
  localidad: z.nativeEnum(Localidad).optional(),
});

const ParamsIdSchema = z.object({
  id: z.coerce.number().int(),
});

export class PeliculaController {
  constructor(private readonly repository: ICarteleraRepository) {}

  getEstrenos = async (req: Request, res: Response): Promise<void> => {
    const parse = QueryEstrenosSchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.format() });
      return;
    }

    const { page, limit, orden } = parse.data;

    const resultado = await this.repository.getPeliculasByCategoriaPaginadas(
      Categoria.ESTRENOS,
      { page, limit, orden },
    );
    res.json(resultado);
  };

  getReestrenos = async (req: Request, res: Response): Promise<void> => {
    const parse = QueryReestrenosSchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.format() });
      return;
    }

    const { page, limit, orden, periodo: filtroPeriodo, cineIds, localidad } = parse.data;

    const resultado = await this.repository.getPeliculasByCategoriaPaginadas(
      Categoria.REESTRENOS,
      {
        filtroPeriodo,
        orden,
        page,
        limit,
        ...(cineIds !== undefined && cineIds.length > 0 && { cineIds }),
        ...(localidad !== undefined && { localidad }),
      },
    );
    res.json(resultado);
  };

  getCines = async (_req: Request, res: Response): Promise<void> => {
    const cines = await this.repository.getCines();
    res.json(cines);
  };

  getPeliculaById = async (req: Request, res: Response): Promise<void> => {
    const parse = ParamsIdSchema.safeParse(req.params);
    if (!parse.success) {
      res.status(400).json({ error: "El id debe ser un número entero válido." });
      return;
    }

    const { id } = parse.data;
    const pelicula = await this.repository.getPeliculaById(id);
    if (!pelicula) {
      res.status(404).json({ error: "Película no encontrada." });
      return;
    }

    res.json(pelicula);
  };
}
