import { JsonReviewRepository } from "./json-review-repository";
import { LocalBrowserProvider } from "./local-browser-provider";
import { RefreshReviews } from "../src/scraping/refresh-reviews";
import { TabelogReviewScraper } from "../src/scraping/tabelog-review-scraper";

const refreshReviews = new RefreshReviews(
  new TabelogReviewScraper(new LocalBrowserProvider()),
  new JsonReviewRepository(),
);

refreshReviews
  .execute()
  .then(({ count }) => {
    console.log(`${count}件を data/reviews.json に保存しました。`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
