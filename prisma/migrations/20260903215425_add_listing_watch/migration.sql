-- CreateTable
CREATE TABLE "ListingWatch" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeenListing" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeenListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingWatch_accountId_idx" ON "ListingWatch"("accountId");

-- CreateIndex
CREATE INDEX "SeenListing_watchId_idx" ON "SeenListing"("watchId");

-- CreateIndex
CREATE UNIQUE INDEX "SeenListing_watchId_url_key" ON "SeenListing"("watchId", "url");

-- AddForeignKey
ALTER TABLE "ListingWatch" ADD CONSTRAINT "ListingWatch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeenListing" ADD CONSTRAINT "SeenListing_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "ListingWatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
