/*
  Warnings:

  - You are about to drop the column `accountId` on the `ReleaseEvent` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TrackedRelease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackedRelease_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrackedRelease_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "ReleaseEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReleaseEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT NOT NULL,
    "retailer" TEXT,
    "releaseDate" DATETIME NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "createdByAccountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReleaseEvent_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ReleaseEvent" ("createdAt", "id", "notes", "productName", "releaseDate", "retailer", "status", "updatedAt", "url") SELECT "createdAt", "id", "notes", "productName", "releaseDate", "retailer", "status", "updatedAt", "url" FROM "ReleaseEvent";
DROP TABLE "ReleaseEvent";
ALTER TABLE "new_ReleaseEvent" RENAME TO "ReleaseEvent";
CREATE INDEX "ReleaseEvent_createdByAccountId_idx" ON "ReleaseEvent"("createdByAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TrackedRelease_accountId_idx" ON "TrackedRelease"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedRelease_accountId_releaseId_key" ON "TrackedRelease"("accountId", "releaseId");
