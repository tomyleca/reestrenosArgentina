/*
  Warnings:

  - A unique constraint covering the columns `[titulo]` on the table `Pelicula` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tmdbId]` on the table `Pelicula` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Pelicula" ADD COLUMN     "tmdbId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Pelicula_titulo_key" ON "Pelicula"("titulo");

-- CreateIndex
CREATE UNIQUE INDEX "Pelicula_tmdbId_key" ON "Pelicula"("tmdbId");
