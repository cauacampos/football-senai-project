/*
  Warnings:

  - A unique constraint covering the columns `[nome_normalizado]` on the table `clubes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nome_normalizado` to the `clubes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "clubes_nome_key";

-- AlterTable
ALTER TABLE "clubes" ADD COLUMN     "nome_normalizado" VARCHAR(60) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clubes_nome_normalizado_key" ON "clubes"("nome_normalizado");
