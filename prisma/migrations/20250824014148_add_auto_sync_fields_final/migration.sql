-- CreateTable
CREATE TABLE "BackupFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT,
    "category" TEXT,
    "syncMetadata" JSONB,
    "deviceId" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,
    "isAutoSync" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BackupFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupFile_userId_idx" ON "BackupFile"("userId");

-- CreateIndex
CREATE INDEX "BackupFile_createdAt_idx" ON "BackupFile"("createdAt");

-- CreateIndex
CREATE INDEX "BackupFile_category_idx" ON "BackupFile"("category");

-- CreateIndex
CREATE INDEX "BackupFile_isAutoSync_idx" ON "BackupFile"("isAutoSync");

-- AddForeignKey
ALTER TABLE "BackupFile" ADD CONSTRAINT "BackupFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
