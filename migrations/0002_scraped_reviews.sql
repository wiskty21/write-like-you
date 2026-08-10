-- Migration number: 0002 	 2026-08-08T00:00:00.000Z
CREATE TABLE scraped_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  restaurant_name TEXT NOT NULL,
  restaurant_url TEXT NOT NULL,
  detail_url TEXT NOT NULL UNIQUE,
  title TEXT,
  body TEXT,
  review_date TEXT NOT NULL
    CHECK (review_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  rating REAL NOT NULL
    CHECK (rating BETWEEN 0 AND 5),
  like_count INTEGER NOT NULL
    CHECK (like_count >= 0),
  scraped_at TEXT NOT NULL
);

CREATE INDEX idx_scraped_reviews_review_date
  ON scraped_reviews (review_date DESC);

CREATE INDEX idx_scraped_reviews_rating
  ON scraped_reviews (rating DESC);

CREATE TABLE review_scrape_metadata (
  id INTEGER PRIMARY KEY NOT NULL
    CHECK (id = 1),
  last_updated_at TEXT NOT NULL
);
