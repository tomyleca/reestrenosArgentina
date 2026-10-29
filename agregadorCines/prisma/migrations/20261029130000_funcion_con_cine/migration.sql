-- Las funciones existentes no tienen cine y no se puede deducir cuál era
-- (una película puede estar en varios). Se regeneran en cada refresco, así
-- que se descartan.
DELETE FROM "Funcion";

-- DropIndex
DROP INDEX "Funcion_peliculaId_fecha_key";

-- AlterTable
ALTER TABLE "Funcion" ADD COLUMN     "cineId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Funcion_peliculaId_cineId_fecha_key" ON "Funcion"("peliculaId", "cineId", "fecha");

-- AddForeignKey
ALTER TABLE "Funcion" ADD CONSTRAINT "Funcion_cineId_fkey" FOREIGN KEY ("cineId") REFERENCES "Cine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
