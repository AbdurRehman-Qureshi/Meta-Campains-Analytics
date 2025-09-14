/*
  Warnings:

  - You are about to drop the column `clientName` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[AdAccountId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "clientName";

-- CreateIndex
CREATE UNIQUE INDEX "Client_AdAccountId_key" ON "public"."Client"("AdAccountId");
