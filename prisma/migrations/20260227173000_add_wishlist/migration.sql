-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator" TEXT,
    "years" TEXT,
    "image" TEXT,
    "excerpt" TEXT,
    "externalRating" DOUBLE PRECISION,
    "externalId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_category_externalId_key" ON "wishlist_items"("userId", "category", "externalId");

-- CreateIndex
CREATE INDEX "wishlist_items_userId_category_addedAt_idx" ON "wishlist_items"("userId", "category", "addedAt");

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
