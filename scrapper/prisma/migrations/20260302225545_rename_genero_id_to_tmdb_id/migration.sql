/*
  Warnings:

  - The primary key for the `Genero` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Genero` table. All the data in the column will be lost.
  - Added the required column `tmdbId` to the `Genero` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_GeneroToPelicula" DROP CONSTRAINT "_GeneroToPelicula_A_fkey";

-- AlterTable
ALTER TABLE "Genero" DROP CONSTRAINT "Genero_pkey",
DROP COLUMN "id",
ADD COLUMN     "tmdbId" INTEGER NOT NULL,
ADD CONSTRAINT "Genero_pkey" PRIMARY KEY ("tmdbId");

-- AddForeignKey
ALTER TABLE "_GeneroToPelicula" ADD CONSTRAINT "_GeneroToPelicula_A_fkey" FOREIGN KEY ("A") REFERENCES "Genero"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE;
