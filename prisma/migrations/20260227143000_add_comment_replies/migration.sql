-- AlterTable
ALTER TABLE "comments" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "comments_postId_parentId_createdAt_idx" ON "comments"("postId", "parentId", "createdAt");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
