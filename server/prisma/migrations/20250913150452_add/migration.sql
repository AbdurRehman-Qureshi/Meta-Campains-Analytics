/*
  Warnings:

  - You are about to drop the column `atc` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `ctrAll` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `ctrLink` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `fatigueFlag` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `ic` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `impressions` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `lpvRate` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `purchases` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `thumb_stop_ratio` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `atc` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `atcValue` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `cpa` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `cpatc` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `cpc` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `cpic` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `ctrAll` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `ctrLink` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `ic` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `icValue` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `impressions` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `linkClicks` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `lpv` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `lpvRate` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseValue` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `purchases` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `reach` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `roas` on the `AdSet` table. All the data in the column will be lost.
  - You are about to drop the column `aov` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `cpm` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `impressions` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `learning_phase` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `mer` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `revenue` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `roas` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `spend` on the `Campaign` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[adSetId]` on the table `AdSet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[campaignId]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[AdAccountId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Ad" DROP COLUMN "atc",
DROP COLUMN "ctrAll",
DROP COLUMN "ctrLink",
DROP COLUMN "fatigueFlag",
DROP COLUMN "ic",
DROP COLUMN "impressions",
DROP COLUMN "lpvRate",
DROP COLUMN "purchases",
DROP COLUMN "thumb_stop_ratio";

-- AlterTable
ALTER TABLE "public"."AdSet" DROP COLUMN "atc",
DROP COLUMN "atcValue",
DROP COLUMN "cpa",
DROP COLUMN "cpatc",
DROP COLUMN "cpc",
DROP COLUMN "cpic",
DROP COLUMN "ctrAll",
DROP COLUMN "ctrLink",
DROP COLUMN "frequency",
DROP COLUMN "ic",
DROP COLUMN "icValue",
DROP COLUMN "impressions",
DROP COLUMN "linkClicks",
DROP COLUMN "lpv",
DROP COLUMN "lpvRate",
DROP COLUMN "purchaseValue",
DROP COLUMN "purchases",
DROP COLUMN "reach",
DROP COLUMN "roas";

-- AlterTable
ALTER TABLE "public"."Campaign" DROP COLUMN "aov",
DROP COLUMN "cpm",
DROP COLUMN "impressions",
DROP COLUMN "learning_phase",
DROP COLUMN "mer",
DROP COLUMN "revenue",
DROP COLUMN "roas",
DROP COLUMN "spend";

-- CreateTable
CREATE TABLE "public"."campaignLevelMetric" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aov" DECIMAL(65,30) NOT NULL,
    "cpm" DECIMAL(65,30) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "learning_phase" BOOLEAN NOT NULL,
    "mer" DECIMAL(65,30) NOT NULL,
    "revenue" DECIMAL(65,30) NOT NULL,
    "roas" DECIMAL(65,30) NOT NULL,
    "spend" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "campaignLevelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adSetLevelMetric" (
    "id" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atc" INTEGER NOT NULL,
    "atcValue" DECIMAL(65,30) NOT NULL,
    "cpa" DECIMAL(65,30) NOT NULL,
    "cpatc" DECIMAL(65,30) NOT NULL,
    "cpc" DECIMAL(65,30) NOT NULL,
    "cpic" DECIMAL(65,30) NOT NULL,
    "ctrAll" DOUBLE PRECISION NOT NULL,
    "ctrLink" DOUBLE PRECISION NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "ic" INTEGER NOT NULL,
    "icValue" DECIMAL(65,30) NOT NULL,
    "impressions" INTEGER NOT NULL,
    "linkClicks" INTEGER NOT NULL,
    "lpv" INTEGER NOT NULL,
    "lpvRate" DOUBLE PRECISION NOT NULL,
    "purchaseValue" DECIMAL(65,30) NOT NULL,
    "purchases" INTEGER NOT NULL,
    "reach" INTEGER NOT NULL,
    "roas" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "adSetLevelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adLevelMetric" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atc" INTEGER NOT NULL,
    "ctrAll" DOUBLE PRECISION NOT NULL,
    "ctrLink" DOUBLE PRECISION NOT NULL,
    "fatigueFlag" BOOLEAN NOT NULL,
    "ic" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "lpvRate" DOUBLE PRECISION NOT NULL,
    "purchases" INTEGER NOT NULL,
    "thumb_stop_ratio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "adLevelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdSet_adSetId_key" ON "public"."AdSet"("adSetId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_campaignId_key" ON "public"."Campaign"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_AdAccountId_key" ON "public"."Client"("AdAccountId");

-- AddForeignKey
ALTER TABLE "public"."campaignLevelMetric" ADD CONSTRAINT "campaignLevelMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adSetLevelMetric" ADD CONSTRAINT "adSetLevelMetric_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "public"."AdSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adLevelMetric" ADD CONSTRAINT "adLevelMetric_adId_fkey" FOREIGN KEY ("adId") REFERENCES "public"."Ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
