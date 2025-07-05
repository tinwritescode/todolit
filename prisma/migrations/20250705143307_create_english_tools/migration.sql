-- CreateTable
CREATE TABLE "EnglishTools" (
    "id" SERIAL NOT NULL,
    "sentence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "b1Level" TEXT[],
    "b2Level" TEXT[],
    "a1Level" TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "feedback" TEXT,

    CONSTRAINT "EnglishTools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnglishTools_authorId_idx" ON "EnglishTools"("authorId");

-- AddForeignKey
ALTER TABLE "EnglishTools" ADD CONSTRAINT "EnglishTools_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
