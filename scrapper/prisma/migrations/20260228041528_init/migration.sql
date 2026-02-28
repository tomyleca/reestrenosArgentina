-- CreateEnum
CREATE TYPE "Localidad" AS ENUM ('CABA', 'GBA');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('ESTRENOS', 'REESTRENOS');

-- CreateTable
CREATE TABLE "Pelicula" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "activa" BOOLEAN NOT NULL,

    CONSTRAINT "Pelicula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cine" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "localidad" "Localidad" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Cine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genero" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Genero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CineToPelicula" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CineToPelicula_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GeneroToPelicula" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GeneroToPelicula_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CineToPelicula_B_index" ON "_CineToPelicula"("B");

-- CreateIndex
CREATE INDEX "_GeneroToPelicula_B_index" ON "_GeneroToPelicula"("B");

-- AddForeignKey
ALTER TABLE "_CineToPelicula" ADD CONSTRAINT "_CineToPelicula_A_fkey" FOREIGN KEY ("A") REFERENCES "Cine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CineToPelicula" ADD CONSTRAINT "_CineToPelicula_B_fkey" FOREIGN KEY ("B") REFERENCES "Pelicula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneroToPelicula" ADD CONSTRAINT "_GeneroToPelicula_A_fkey" FOREIGN KEY ("A") REFERENCES "Genero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneroToPelicula" ADD CONSTRAINT "_GeneroToPelicula_B_fkey" FOREIGN KEY ("B") REFERENCES "Pelicula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
