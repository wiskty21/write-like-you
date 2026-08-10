import { Hono } from "hono";
import { createRefreshReviews } from "./create-refresh-reviews";
import { generateReview } from "./generate";
import { getReviewSource } from "./review-source";
import { getReviews } from "./reviews";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/api/generate", (context) => {
  return generateReview(context.req.raw, context.env);
});

app.all("/api/generate", (context) => {
  context.header("Allow", "POST");
  return context.json({ error: "POSTで送信してください。" }, 405);
});

app.get("/api/health", async (context) => {
  const styleSamples = await getReviewSource(context.env).getStyleSamples();

  return context.json({ status: "ok", writingSamples: styleSamples.length });
});

app.get("/api/reviews", (context) => {
  return getReviews(context.env);
});

app.all("/api/*", (context) => context.json({ error: "APIが見つかりません。" }, 404));
app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));

app.onError((error, context) => {
  console.error("Request failed", error);
  return context.json({ error: "生成に失敗しました。時間をおいて再度お試しください。" }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller, env) {
    console.log("口コミの定期更新を開始します");
    const result = await createRefreshReviews(env).execute();
    console.log("口コミの定期更新が完了しました", result);
  },
} satisfies ExportedHandler<CloudflareBindings>;
