/*
  Warnings:

  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromptTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubPrompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklyOverview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "Prompt" DROP CONSTRAINT "Prompt_promptTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Prompt" DROP CONSTRAINT "Prompt_userId_fkey";

-- DropForeignKey
ALTER TABLE "PromptTemplate" DROP CONSTRAINT "PromptTemplate_userId_fkey";

-- DropForeignKey
ALTER TABLE "SubPrompt" DROP CONSTRAINT "SubPrompt_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_weeklyOverviewId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_deployedById_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyOverview" DROP CONSTRAINT "WeeklyOverview_userId_fkey";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Prompt";

-- DropTable
DROP TABLE "PromptTemplate";

-- DropTable
DROP TABLE "SubPrompt";

-- DropTable
DROP TABLE "Todo";

-- DropTable
DROP TABLE "Token";

-- DropTable
DROP TABLE "WeeklyOverview";

-- DropEnum
DROP TYPE "PromptStatus";
