import { runReviewModel, type ReviewModelInput } from "./ai";
import { getReviewSource } from "./review-source";

type GenerateInput = {
  restaurantName: string;
  experience: string;
  rating: number;
  personalEpisode: string;
};

const outputSchema = {
  type: "object",
  properties: { title: { type: "string" }, body: { type: "string" } },
  required: ["title", "body"],
};

function readText(value: unknown, name: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name}を入力してください。`);
  if (value.trim().length > maxLength) throw new Error(`${name}は${maxLength}文字以内で入力してください。`);
  return value.trim();
}

function parseInput(value: unknown): GenerateInput {
  if (typeof value !== "object" || value === null) throw new Error("入力内容が正しくありません。");

  const input = value as Record<string, unknown>;
  const { rating, personalEpisode } = input;
  if (typeof rating !== "number" || !Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new Error("評価は0〜5の数値で入力してください。");
  }
  if (typeof personalEpisode !== "string" || personalEpisode.length > 2000) {
    throw new Error("日記・個人的エピソードは2000文字以内で入力してください。");
  }

  return {
    restaurantName: readText(input.restaurantName, "店名", 100),
    experience: readText(input.experience, "注文内容・体験", 3000),
    rating,
    personalEpisode: personalEpisode.trim(),
  };
}

function buildModelInput(
  input: GenerateInput,
  styleSamples: { title: string | null; body: string }[],
) {
  return {
    messages: [
      {
        role: "system",
        content: [
          "あなたは、ユーザー本人の食後の独り言を口コミにするゴーストライターです。入力の要約ではなく、本人が読み返してクスッとできる下書きを作ります。",
          "事実として使えるのはcurrentInputだけです。styleSamplesからは文体だけを学び、店名、料理、人物、会話、価格、出来事を流用しません。",
          "本人の文体は、率直な一人称、短い断定、感情の反復、急な独り言、軽い自虐、少し脱線してから食事へ戻る構成が特徴です。きれいに整えすぎないでください。",
          "本文は、最も印象の強い事実から始め、短い反応や自分へのツッコミを挟み、残りの体験をつなぎ、入力評価に釣り合う感想で締めます。currentInputの並び順をそのままなぞりません。",
          "書く前にcurrentInputの事実を内部で列挙し、すべての事実表現がそのどれかと一致することを確認してください。列挙自体は出力しません。",
          "personalEpisodeがあれば食事から自然に脱線して使い、空なら日記を創作しません。面白さは短い比喩、リズム、自分へのツッコミで作ります。新しい行動、会話、評価、理由、因果関係、時間、比較は追加しません。",
          "『少し』『かなり』など入力の程度を強めたり弱めたりしません。評価が4.5未満なら『最高』『完璧』『絶品』を使いません。事実が少なければ短く終え、文字数を埋めるための内容を作りません。",
          "タイトルは最も印象的な事実と本人の反応を組み合わせた8〜25文字にします。",
          "titleとbodyをJSON Schemaどおりに返してください。",
        ].join("\n"),
      },
      { role: "user", content: JSON.stringify({ styleSamples, currentInput: input }) },
    ],
    max_tokens: 900,
    temperature: 0.8,
    response_format: { type: "json_schema", json_schema: outputSchema },
  } satisfies ReviewModelInput;
}

function parseGeneratedReview(value: unknown) {
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (typeof parsed !== "object" || parsed === null) throw new Error("AIの出力形式が正しくありません。");

  const result = parsed as Record<string, unknown>;
  if (typeof result.title !== "string" || typeof result.body !== "string") {
    throw new Error("AIの出力形式が正しくありません。");
  }
  return { title: result.title.trim(), body: result.body.trim() };
}

export async function generateReview(request: Request, env: CloudflareBindings) {
  let input: GenerateInput;
  try {
    input = parseInput(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "入力内容が正しくありません。";
    return Response.json({ error: message }, { status: 400 });
  }

  const styleSamples = await getReviewSource(env).getStyleSamples();
  const generated = parseGeneratedReview(
    await runReviewModel(env, buildModelInput(input, styleSamples)),
  );
  return Response.json({
    ...generated,
    notice: "入力内容と事実関係を確認してから投稿してください。",
  });
}
