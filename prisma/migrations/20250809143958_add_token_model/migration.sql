-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "network" TEXT,
    "deployTxHash" TEXT NOT NULL,
    "initializeTxHash" TEXT,
    "deployerAddress" TEXT NOT NULL,
    "totalSupply" TEXT,
    "ownerPercent" INTEGER,
    "airdropPercent" INTEGER,
    "salePercent" INTEGER,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deployedById" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE INDEX "Token_deployedById_idx" ON "Token"("deployedById");

-- CreateIndex
CREATE INDEX "Token_chainId_idx" ON "Token"("chainId");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_deployedById_fkey" FOREIGN KEY ("deployedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
