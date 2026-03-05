import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";


//TODO: hacer un solo objeto y que reciba un dto?
interface CinemarkApiResponse {
    data: { title: string }[];
}

export function cinemarkApiMapper(
    responseObject: CinemarkApiResponse,
    cine: Cine,
): PeliculaInput[] {
    return responseObject.data.map((item) => ({
        titulo: item.title,
        cine,
    }));
}
