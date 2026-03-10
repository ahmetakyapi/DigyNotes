WITH ranked_categories AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "userId", name
      ORDER BY "createdAt" ASC, id ASC
    ) AS row_num
  FROM categories
)
DELETE FROM categories
WHERE id IN (
  SELECT id
  FROM ranked_categories
  WHERE row_num > 1
);

ALTER TABLE categories
ADD CONSTRAINT "categories_userId_name_key" UNIQUE ("userId", name);
