// src/worker/reviews.ts

import reviews from "../../data/reviews.json";
import reviewsMeta from "../../data/reviews-meta.json";

export function getReviews() {
  return Response.json({
    reviews,
    lastUpdatedAt: reviewsMeta.lastUpdatedAt,
  });
}
