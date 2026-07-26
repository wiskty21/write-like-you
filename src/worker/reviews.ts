// src/worker/reviews.ts

import reviews from "../../data/reviews.json";

export function getReviews() {
  return Response.json({ reviews });
}
