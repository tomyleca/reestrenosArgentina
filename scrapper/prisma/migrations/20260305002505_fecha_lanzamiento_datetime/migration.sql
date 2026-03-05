/*
  Warnings:

  - The `fechaLanzamiento` column on the `Pelicula` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Pelicula" DROP COLUMN "fechaLanzamiento",
ADD COLUMN     "fechaLanzamiento" TIMESTAMP(3);
