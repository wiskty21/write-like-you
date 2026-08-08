import { RefreshReviews } from "../scraping/refresh-reviews";
import { TabelogReviewScraper } from "../scraping/tabelog-review-scraper";
import { CloudflareBrowserProvider } from "./cloudflare-browser-provider";
import { D1ReviewRepository } from "./d1-review-repository";

export function createRefreshReviews(env: CloudflareBindings) {
  return new RefreshReviews(
    new TabelogReviewScraper(new CloudflareBrowserProvider(env.BROWSER)),
    new D1ReviewRepository(env.DB),
  );
}
