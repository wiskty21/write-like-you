import { D1ReviewRepository } from "./d1-review-repository";

export async function getReviews(db: D1Database) {
  return Response.json(await new D1ReviewRepository(db).getAll());
}
