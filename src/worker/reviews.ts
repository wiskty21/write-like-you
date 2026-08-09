import reviews from "../../data/reviews.json";
import reviewsMeta from "../../data/reviews-meta.json";
import { D1ReviewRepository } from "./d1-review-repository";

export async function getReviews(env: CloudflareBindings) {
  if (env.REVIEW_SOURCE === "json") {
    return Response.json({
      reviews,
      lastUpdatedAt: reviewsMeta.lastUpdatedAt,
    });
  }

  if (env.REVIEW_SOURCE === "d1") {
    return Response.json(await new D1ReviewRepository(env.DB).getAll());
  }

  throw new Error("REVIEW_SOURCEはjsonまたはd1を指定してください。");
}
