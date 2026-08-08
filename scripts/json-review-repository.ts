import { writeFile } from "node:fs/promises";
import type { ReviewRepository } from "../src/scraping/review-repository";
import type { Review } from "../src/scraping/review";

const OUTPUT_PATH = new URL("../data/reviews.json", import.meta.url);
const META_OUTPUT_PATH = new URL("../data/reviews-meta.json", import.meta.url);

export class JsonReviewRepository implements ReviewRepository {
  async replaceAll(reviews: Review[], scrapedAt: string) {
    await Promise.all([
      writeFile(OUTPUT_PATH, `${JSON.stringify(reviews, null, 2)}\n`),
      writeFile(
        META_OUTPUT_PATH,
        `${JSON.stringify({ lastUpdatedAt: scrapedAt }, null, 2)}\n`,
      ),
    ]);
  }
}
