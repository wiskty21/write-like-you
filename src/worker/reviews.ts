import { getReviewSource } from "./review-source";

export async function getReviews(env: CloudflareBindings) {
  return Response.json(await getReviewSource(env).getAll());
}
