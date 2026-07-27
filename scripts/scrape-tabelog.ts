import { writeFile } from "node:fs/promises";
import { chromium, type Locator, type Page } from "playwright";

const START_URL = "https://tabelog.com/rvwr/wi2kty/reviewed_restaurants/list";
const OUTPUT_PATH = new URL("../data/reviews.json", import.meta.url);
const META_OUTPUT_PATH = new URL("../data/reviews-meta.json", import.meta.url);
const WAIT_MS = 1_000;

type ReviewLink = { name: string; url: string; detailUrl: string };
type Review = Omit<ReviewLink, "detailUrl"> & {
  title: string | null;
  body: string | null;
  rating: number;
  likeCount: number;
};

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

async function openPage(page: Page, url: string, target: string) {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  if (!response?.ok()) {
    throw new Error(
      `${target}の取得に失敗しました: ${response?.status() ?? "応答なし"} ${url}`,
    );
  }
}

async function optionalText(locator: Locator) {
  return (await locator.count()) > 0 ? normalize(await locator.innerText()) : null;
}

async function collectReviewLinks(page: Page) {
  const reviews = new Map<string, ReviewLink>();
  let url: string | null = START_URL;

  while (url) {
    await openPage(page, url, "一覧ページ");

    const pageReviews = await page.locator(".rvw-item").evaluateAll((items) =>
      items.map((item) => {
        const link = item.querySelector<HTMLAnchorElement>("a.rvw-item__rst-name");
        const detailPath = item.getAttribute("data-detail-url");
        return {
          name: link?.textContent?.replace(/\s+/g, " ").trim() ?? "",
          url: link?.href ?? "",
          detailUrl: detailPath ? new URL(detailPath, location.origin).href : "",
        };
      }),
    );

    if (pageReviews.length === 0) {
      throw new Error(`店舗情報が見つかりませんでした: ${url}`);
    }

    for (const review of pageReviews) {
      if (review.name && review.url && review.detailUrl) {
        reviews.set(review.detailUrl, review);
      }
    }

    const nextLink = page.locator('a[rel="next"]');
    url = (await nextLink.count()) > 0 ? await nextLink.getAttribute("href") : null;
    if (url) await page.waitForTimeout(WAIT_MS);
  }

  return [...reviews.values()];
}

async function scrapeReview(page: Page, link: ReviewLink) {
  await openPage(page, link.detailUrl, "口コミ詳細ページ");

  const likeElement = page
    .locator(".rvw-item__vote-like .js-like-btn-count > span")
    .first();
  const likeText = await optionalText(likeElement);
  const rating = Number(await page.locator(".rvw-item__ratings--val").first().innerText());
  const likeCount = Number(likeText ?? 0);

  if (!Number.isFinite(rating) || !Number.isInteger(likeCount)) {
    throw new Error(`点数またはいいね数が不正です: ${link.detailUrl}`);
  }

  return {
    review: {
      name: link.name,
      url: link.url,
      title: await optionalText(page.locator(".rvw-item__title").first()),
      body: await optionalText(page.locator(".rvw-item__rvw-comment").first()),
      rating,
      likeCount,
    } satisfies Review,
    foundLikeElement: likeText !== null,
  };
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: false });

  try {
    const links = await collectReviewLinks(await browser.newPage({ locale: "ja-JP" }));
    const detailPage = await browser.newPage({ locale: "ja-JP" });
    const reviews: Review[] = [];
    let foundLikeElement = false;

    for (const link of links) {
      const result = await scrapeReview(detailPage, link);
      reviews.push(result.review);
      foundLikeElement ||= result.foundLikeElement;
      await detailPage.waitForTimeout(WAIT_MS);
    }

    if (!foundLikeElement) {
      throw new Error("全件でいいね数が見つかりませんでした。DOM構造を確認してください。");
    }

    const lastUpdatedAt = new Date().toISOString();
    await Promise.all([
      writeFile(OUTPUT_PATH, `${JSON.stringify(reviews, null, 2)}\n`),
      writeFile(
        META_OUTPUT_PATH,
        `${JSON.stringify({ lastUpdatedAt }, null, 2)}\n`,
      ),
    ]);
    console.log(`${reviews.length}件を data/reviews.json に保存しました。`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
