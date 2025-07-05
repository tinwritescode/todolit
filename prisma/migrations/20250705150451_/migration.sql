-- CreateEnum
CREATE TYPE "EnglishToolsStatus" AS ENUM ('INITIAL', 'PENDING', 'COMPLETE', 'ERROR');

-- AlterTable
ALTER TABLE "EnglishTools" ADD COLUMN     "status" "EnglishToolsStatus" NOT NULL DEFAULT 'INITIAL';
