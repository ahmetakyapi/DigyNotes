ALTER TABLE "posts"
ADD COLUMN "lat" DOUBLE PRECISION,
ADD COLUMN "lng" DOUBLE PRECISION;

CREATE INDEX "posts_category_lat_lng_idx" ON "posts"("category", "lat", "lng");
