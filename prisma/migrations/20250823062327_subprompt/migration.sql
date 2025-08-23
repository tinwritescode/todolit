-- CreateTable
CREATE TABLE "SubPrompt" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promptId" INTEGER,

    CONSTRAINT "SubPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubPrompt_promptId_idx" ON "SubPrompt"("promptId");

-- AddForeignKey
ALTER TABLE "SubPrompt" ADD CONSTRAINT "SubPrompt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
