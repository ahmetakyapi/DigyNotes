UPDATE posts
SET category = CASE category
  WHEN 'Film' THEN 'movies'
  WHEN 'Movie' THEN 'movies'
  WHEN 'Movies' THEN 'movies'
  WHEN 'movie' THEN 'movies'
  WHEN 'movies' THEN 'movies'
  WHEN 'Dizi' THEN 'series'
  WHEN 'Series' THEN 'series'
  WHEN 'series' THEN 'series'
  WHEN 'Oyun' THEN 'game'
  WHEN 'Game' THEN 'game'
  WHEN 'game' THEN 'game'
  WHEN 'Kitap' THEN 'book'
  WHEN 'Book' THEN 'book'
  WHEN 'book' THEN 'book'
  WHEN 'Gezi' THEN 'travel'
  WHEN 'Travel' THEN 'travel'
  WHEN 'travel' THEN 'travel'
  WHEN 'Diğer' THEN 'other'
  WHEN 'Diger' THEN 'other'
  WHEN 'Other' THEN 'other'
  WHEN 'other' THEN 'other'
  ELSE category
END
WHERE category IN (
  'Film', 'Movie', 'Movies', 'movie', 'movies',
  'Dizi', 'Series', 'series',
  'Oyun', 'Game', 'game',
  'Kitap', 'Book', 'book',
  'Gezi', 'Travel', 'travel',
  'Diğer', 'Diger', 'Other', 'other'
);

UPDATE wishlist_items
SET category = CASE category
  WHEN 'Film' THEN 'movies'
  WHEN 'Movie' THEN 'movies'
  WHEN 'Movies' THEN 'movies'
  WHEN 'movie' THEN 'movies'
  WHEN 'movies' THEN 'movies'
  WHEN 'Dizi' THEN 'series'
  WHEN 'Series' THEN 'series'
  WHEN 'series' THEN 'series'
  WHEN 'Oyun' THEN 'game'
  WHEN 'Game' THEN 'game'
  WHEN 'game' THEN 'game'
  WHEN 'Kitap' THEN 'book'
  WHEN 'Book' THEN 'book'
  WHEN 'book' THEN 'book'
  WHEN 'Gezi' THEN 'travel'
  WHEN 'Travel' THEN 'travel'
  WHEN 'travel' THEN 'travel'
  WHEN 'Diğer' THEN 'other'
  WHEN 'Diger' THEN 'other'
  WHEN 'Other' THEN 'other'
  WHEN 'other' THEN 'other'
  ELSE category
END
WHERE category IN (
  'Film', 'Movie', 'Movies', 'movie', 'movies',
  'Dizi', 'Series', 'series',
  'Oyun', 'Game', 'game',
  'Kitap', 'Book', 'book',
  'Gezi', 'Travel', 'travel',
  'Diğer', 'Diger', 'Other', 'other'
);

UPDATE categories
SET name = CASE name
  WHEN 'Film' THEN 'movies'
  WHEN 'Movie' THEN 'movies'
  WHEN 'Movies' THEN 'movies'
  WHEN 'movie' THEN 'movies'
  WHEN 'movies' THEN 'movies'
  WHEN 'Dizi' THEN 'series'
  WHEN 'Series' THEN 'series'
  WHEN 'series' THEN 'series'
  WHEN 'Oyun' THEN 'game'
  WHEN 'Game' THEN 'game'
  WHEN 'game' THEN 'game'
  WHEN 'Kitap' THEN 'book'
  WHEN 'Book' THEN 'book'
  WHEN 'book' THEN 'book'
  WHEN 'Gezi' THEN 'travel'
  WHEN 'Travel' THEN 'travel'
  WHEN 'travel' THEN 'travel'
  WHEN 'Diğer' THEN 'other'
  WHEN 'Diger' THEN 'other'
  WHEN 'Other' THEN 'other'
  WHEN 'other' THEN 'other'
  ELSE name
END
WHERE name IN (
  'Film', 'Movie', 'Movies', 'movie', 'movies',
  'Dizi', 'Series', 'series',
  'Oyun', 'Game', 'game',
  'Kitap', 'Book', 'book',
  'Gezi', 'Travel', 'travel',
  'Diğer', 'Diger', 'Other', 'other'
);
