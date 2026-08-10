import type { Review } from "./review";

export interface ReviewRepository {
  replaceAll(reviews: Review[], scrapedAt: string): Promise<void>;
}
