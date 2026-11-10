/*
  Warnings:

  - You are about to drop the column `code` on the `locations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[zone,aisle,rack,level,position]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aisle` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rack` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone` to the `locations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "locations_code_key";

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "code",
ADD COLUMN     "aisle" INTEGER NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "rack" INTEGER NOT NULL,
ADD COLUMN     "zone" VARCHAR(1) NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "locations_zone_aisle_rack_level_position_key" ON "locations"("zone", "aisle", "rack", "level", "position");



-- Validate location components
ALTER TABLE "locations"
ADD CONSTRAINT "locations_zone_check"
    CHECK ("zone" ~ '^[A-Z]$'),
ADD CONSTRAINT "locations_aisle_check"
    CHECK ("aisle" BETWEEN 1 AND 99),
ADD CONSTRAINT "locations_rack_check"
    CHECK ("rack" BETWEEN 1 AND 99),
ADD CONSTRAINT "locations_level_check"
    CHECK ("level" BETWEEN 1 AND 99),
ADD CONSTRAINT "locations_position_check"
    CHECK ("position" BETWEEN 1 AND 99);
