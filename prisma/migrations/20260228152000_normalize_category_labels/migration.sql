UPDATE posts
SET category = CASE category
  WHEN 'Film' THEN 'Movie'
  WHEN 'Dizi' THEN 'Series'
  WHEN 'Oyun' THEN 'Game'
  WHEN 'Kitap' THEN 'Book'
  WHEN 'Gezi' THEN 'Travel'
  WHEN 'Diğer' THEN 'Other'
  WHEN 'Diger' THEN 'Other'
  ELSE category
END
WHERE category IN ('Film', 'Dizi', 'Oyun', 'Kitap', 'Gezi', 'Diğer', 'Diger');

UPDATE wishlist_items
SET category = CASE category
  WHEN 'Film' THEN 'Movie'
  WHEN 'Dizi' THEN 'Series'
  WHEN 'Oyun' THEN 'Game'
  WHEN 'Kitap' THEN 'Book'
  WHEN 'Gezi' THEN 'Travel'
  WHEN 'Diğer' THEN 'Other'
  WHEN 'Diger' THEN 'Other'
  ELSE category
END
WHERE category IN ('Film', 'Dizi', 'Oyun', 'Kitap', 'Gezi', 'Diğer', 'Diger');

UPDATE categories
SET name = CASE name
  WHEN 'Film' THEN 'Movie'
  WHEN 'Dizi' THEN 'Series'
  WHEN 'Oyun' THEN 'Game'
  WHEN 'Kitap' THEN 'Book'
  WHEN 'Gezi' THEN 'Travel'
  WHEN 'Diğer' THEN 'Other'
  WHEN 'Diger' THEN 'Other'
  ELSE name
END
WHERE name IN ('Film', 'Dizi', 'Oyun', 'Kitap', 'Gezi', 'Diğer', 'Diger');
