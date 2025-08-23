-- AlterTable
ALTER TABLE "SubPrompt" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "result" TEXT,
ADD COLUMN     "status" "PromptStatus" NOT NULL DEFAULT 'INITIAL';
