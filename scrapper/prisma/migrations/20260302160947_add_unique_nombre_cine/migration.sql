/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Cine` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Cine_nombre_key" ON "Cine"("nombre");
