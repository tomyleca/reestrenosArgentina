import type { Cine } from "../../core/domain/cine.js";
import type { PeliculaInput } from "../../core/dtos/peliculaInput.js";



interface CinemarkApiResponse {
    data: { title: string, openingDate: string }[];
}

export function cinemarkApiMapper(
    responseObject: CinemarkApiResponse,
    cine: Cine,
): PeliculaInput[] {
    return responseObject.data.map((item) => ({
        titulo: item.title,
		fechaLanzamiento: new Date(item.openingDate),
        cine,
    }));
}
