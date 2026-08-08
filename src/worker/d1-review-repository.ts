import type { ReviewRepository } from "../scraping/review-repository";
import type { Review } from "../scraping/review";

type ReviewRow = {
  id: string;
  restaurant_name: string;
  restaurant_url: string;
  detail_url: string;
  title: string | null;
  body: string | null;
  review_date: string;
  rating: number;
  like_count: number;
};

export class D1ReviewRepository implements ReviewRepository {
  constructor(private readonly db: D1Database) {}

  async replaceAll(reviews: Review[], scrapedAt: string) {
    const insert = this.db.prepare(`
      INSERT INTO scraped_reviews (
        id,
        restaurant_name,
        restaurant_url,
        detail_url,
        title,
        body,
        review_date,
        rating,
        like_count,
        scraped_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `);

    await this.db.batch([
      this.db.prepare("DELETE FROM scraped_reviews"),
      ...reviews.map((review) =>
        insert.bind(
          review.id,
          review.name,
          review.url,
          review.detailUrl,
          review.title,
          review.body,
          review.reviewDate,
          review.rating,
          review.likeCount,
          scrapedAt,
        ),
      ),
      this.db
        .prepare(`
          INSERT INTO review_scrape_metadata (id, last_updated_at)
          VALUES (1, ?1)
          ON CONFLICT (id) DO UPDATE
          SET last_updated_at = excluded.last_updated_at
        `)
        .bind(scrapedAt),
    ]);
  }

  async getAll() {
    const [reviewResult, metadata] = await Promise.all([
      this.db
        .prepare(`
          SELECT
            id,
            restaurant_name,
            restaurant_url,
            detail_url,
            title,
            body,
            review_date,
            rating,
            like_count
          FROM scraped_reviews
          ORDER BY review_date DESC
        `)
        .all<ReviewRow>(),
      this.db
        .prepare(`
          SELECT last_updated_at
          FROM review_scrape_metadata
          WHERE id = 1
        `)
        .first<{ last_updated_at: string }>(),
    ]);

    return {
      reviews: reviewResult.results.map((row) => ({
        id: row.id,
        name: row.restaurant_name,
        url: row.restaurant_url,
        detailUrl: row.detail_url,
        title: row.title,
        body: row.body,
        reviewDate: row.review_date,
        rating: row.rating,
        likeCount: row.like_count,
      } satisfies Review)),
      lastUpdatedAt: metadata?.last_updated_at ?? null,
    };
  }

  async getStyleSamples() {
    const result = await this.db
      .prepare(`
        SELECT title, body
        FROM scraped_reviews
        WHERE body IS NOT NULL
      `)
      .all<{ title: string | null; body: string }>();

    return result.results;
  }
}
