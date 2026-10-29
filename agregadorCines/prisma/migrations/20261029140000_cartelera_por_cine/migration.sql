-- "Activa" deja de ser una columna: una película está en cartelera si tiene
-- funciones de hoy en adelante (cines con funciones) o si apareció en el último
-- scraping exitoso (cines sin funciones).
ALTER TABLE "Pelicula" DROP COLUMN "activa";

-- AlterTable
ALTER TABLE "Cine" ADD COLUMN     "tieneFunciones" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ultimaActualizacion" TIMESTAMP(3);

-- La relación cine-película pasa a significar "vista en el último scraping
-- exitoso del cine". Los vínculos viejos se acumulaban con `connect` y no
-- reflejan eso: se descartan y el próximo refresco los vuelve a cargar.
DELETE FROM "_CineToPelicula";
