import type { Request, Response } from "express";
import type { ICarteleraRepository } from "../repositories/ICarteleraRepository.js";
import { Categoria } from "../core/domain/categoria.js";
import type { FiltroPeriodo } from "./types.js";

export class PeliculaController {
  constructor(private readonly repository: ICarteleraRepository) {}

  getEstrenos = async (req: Request, res: Response): Promise<void> => {
    const soloActivas = parseSoloActivas(req.query.activas as string | undefined);
    const { page, limit } = parsePaginacion(req);
    const resultado = await this.repository.getPeliculasByCategoriaPaginadas(
      Categoria.ESTRENOS,
      { soloActivas, page, limit },
    );
    res.json(resultado);
  };

  getReestrenos = async (req: Request, res: Response): Promise<void> => {
    const periodoRaw = req.query.periodo as string | undefined;
    const filtroPeriodo = parsePeriodo(periodoRaw);

    if (periodoRaw !== undefined && filtroPeriodo === null && periodoRaw !== "") {
      res.status(400).json({ error: "Valor de 'periodo' inválido. Valores aceptados: 'hoy', 'semana'." });
      return;
    }

    const soloActivas = parseSoloActivas(req.query.activas as string | undefined);
    const { page, limit } = parsePaginacion(req);
    const resultado = await this.repository.getPeliculasByCategoriaPaginadas(
      Categoria.REESTRENOS,
      { filtroPeriodo, soloActivas, page, limit },
    );
    res.json(resultado);
  };

  getPeliculaById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "El id debe ser un número." });
      return;
    }

    const pelicula = await this.repository.getPeliculaById(id);
    if (!pelicula) {
      res.status(404).json({ error: "Película no encontrada." });
      return;
    }

    res.json(pelicula);
  };
}

function parsePeriodo(valor: string | undefined): FiltroPeriodo {
  if (valor === "hoy") return "hoy";
  if (valor === "semana") return "semana";
  return null;
}

// Por defecto devuelve solo activas. Solo se desactiva con ?activas=false explícito.
function parseSoloActivas(valor: string | undefined): boolean {
  return valor !== "false";
}

function parsePaginacion(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  return { page, limit };
}
