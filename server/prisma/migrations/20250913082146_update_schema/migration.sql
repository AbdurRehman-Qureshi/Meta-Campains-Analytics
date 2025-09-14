/*
  Warnings:

  - You are about to drop the `CalculatedMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rawMetric` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `atc` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ctrAll` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ctrLink` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatigueFlag` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ic` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `impressions` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpvRate` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchases` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumb_stop_ratio` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adSetId` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atc` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atcValue` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpa` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpatc` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpc` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpic` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ctrAll` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ctrLink` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ic` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icValue` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `impressions` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkClicks` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpv` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lpvRate` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseValue` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchases` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reach` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roas` to the `AdSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aov` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpm` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `impressions` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `learning_phase` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mer` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revenue` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roas` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spend` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CalculatedMetric" DROP CONSTRAINT "CalculatedMetric_adId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rawMetric" DROP CONSTRAINT "rawMetric_adId_fkey";

-- DropIndex
DROP INDEX "public"."Client_AdAccountId_key";

-- AlterTable
ALTER TABLE "public"."Ad" ADD COLUMN     "atc" INTEGER NOT NULL,
ADD COLUMN     "ctrAll" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ctrLink" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fatigueFlag" BOOLEAN NOT NULL,
ADD COLUMN     "ic" INTEGER NOT NULL,
ADD COLUMN     "impressions" INTEGER NOT NULL,
ADD COLUMN     "lpvRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "purchases" INTEGER NOT NULL,
ADD COLUMN     "thumb_stop_ratio" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."AdSet" ADD COLUMN     "adSetId" TEXT NOT NULL,
ADD COLUMN     "atc" INTEGER NOT NULL,
ADD COLUMN     "atcValue" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "cpa" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "cpatc" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "cpc" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "cpic" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "ctrAll" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ctrLink" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "frequency" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ic" INTEGER NOT NULL,
ADD COLUMN     "icValue" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "impressions" INTEGER NOT NULL,
ADD COLUMN     "linkClicks" INTEGER NOT NULL,
ADD COLUMN     "lpv" INTEGER NOT NULL,
ADD COLUMN     "lpvRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "purchaseValue" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "purchases" INTEGER NOT NULL,
ADD COLUMN     "reach" INTEGER NOT NULL,
ADD COLUMN     "roas" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "aov" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "cpm" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "impressions" INTEGER NOT NULL,
ADD COLUMN     "learning_phase" BOOLEAN NOT NULL,
ADD COLUMN     "mer" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "revenue" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "roas" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "spend" DECIMAL(65,30) NOT NULL;

-- DropTable
DROP TABLE "public"."CalculatedMetric";

-- DropTable
DROP TABLE "public"."rawMetric";
