-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('INITIAL', 'PENDING', 'COMPLETE', 'ERROR');

-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "result" TEXT,
ADD COLUMN     "status" "PromptStatus" NOT NULL DEFAULT 'INITIAL';
