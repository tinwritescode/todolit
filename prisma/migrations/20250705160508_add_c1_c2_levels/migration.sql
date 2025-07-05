/*
  Warnings:

  - You are about to drop the column `a1Level` on the `EnglishTools` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EnglishTools" DROP COLUMN "a1Level",
ADD COLUMN     "c1Level" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "c2Level" TEXT[] DEFAULT ARRAY[]::TEXT[];
