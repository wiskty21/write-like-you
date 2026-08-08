import { Hono } from "hono";
import { generateReview } from "./generate";
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
  const result = await context.env.DB
    .prepare("SELECT COUNT(*) AS count FROM writing_samples")
    .first<{ count: number }>();

  return context.json({ status: "ok", writingSamples: result?.count });
});

app.get("/api/reviews", (context) => {
  return getReviews(context.env.DB);
});

app.all("/api/*", (context) => context.json({ error: "APIが見つかりません。" }, 404));
app.all("*", (context) => context.env.ASSETS.fetch(context.req.raw));

app.onError((error, context) => {
  console.error("Request failed", error);
  return context.json({ error: "生成に失敗しました。時間をおいて再度お試しください。" }, 500);
});

export default app;
