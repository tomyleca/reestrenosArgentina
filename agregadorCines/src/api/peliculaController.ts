import type { Request, Response } from "express";
import { z } from "zod";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";
import { Categoria } from "../core/domain/categoria.js";

// SCHEMAS DE VALIDACIÓN
const PaginacionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

const QueryEstrenosSchema = PaginacionSchema.extend({
  activas: z.preprocess((val) => val !== "false", z.boolean()).default(true),
});

const QueryReestrenosSchema = QueryEstrenosSchema.extend({
  periodo: z.enum(["hoy", "semana", "mes"]).nullable().catch(null),
  cineId: z.coerce.number().int().positive().optional(),
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

    const { page, limit, activas: soloActivas } = parse.data;

    const resultado = await this.repository.getPeliculasByCategoriaPaginadas(
      Categoria.ESTRENOS,
      { soloActivas, page, limit },
    );
    res.json(resultado);
  };

  getReestrenos = async (req: Request, res: Response): Promise<void> => {
    const parse = QueryReestrenosSchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.format() });
      return;
    }

    const { page, limit, activas: soloActivas, periodo: filtroPeriodo, cineId } = parse.data;

    const resultado = await this.repository.getPeliculasByCategoriaPaginadas(
      Categoria.REESTRENOS,
      { filtroPeriodo, soloActivas, page, limit, ...(cineId !== undefined && { cineId }) },
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
