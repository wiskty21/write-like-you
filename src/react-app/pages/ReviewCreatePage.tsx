import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";

type GeneratedReview = { title: string; body: string; notice: string };
type Status = { message: string; isError?: boolean };

export function ReviewCreatePage() {
  const [result, setResult] = useState<GeneratedReview>();
  const [status, setStatus] = useState<Status>({ message: "" });
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatus({ message: "口コミを生成しています。" });
    setResult(undefined);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          restaurantName: form.get("restaurantName"),
          experience: form.get("experience"),
          rating: Number(form.get("rating")),
          personalEpisode: form.get("personalEpisode"),
        }),
      });
      const body = await response.json() as GeneratedReview & { error?: string };
      if (!response.ok) throw new Error(body.error || "生成に失敗しました。");

      setResult(body);
      setStatus({ message: "下書きを生成しました。" });
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "生成に失敗しました。", isError: true });
    } finally {
      setIsLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(`${result.title}\n\n${result.body}`);
    setStatus({ message: "コピーしました。" });
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-10" data-theme="cupcake">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm font-bold tracking-widest text-primary">PERSONAL REVIEW WRITER</p>
          <h1 className="mt-2 text-4xl font-bold">口コミにはたらしさを。</h1>
          <p className="mt-3 opacity-70">今回の食事について入力すると、過去の口コミの文体を参考にタイトルと本文を生成します。</p>
          <Link className="link text-sm" to="/reviews">
            口コミ一覧へ戻る
          </Link>
        </header>

        <section className="card bg-base-100 shadow-sm" aria-labelledby="form-title">
          <form className="card-body gap-5" onSubmit={submit}>
            <h2 id="form-title" className="sr-only">口コミ入力フォーム</h2>
            <Field label="店名"><input className="input w-full" name="restaurantName" required maxLength={100} autoComplete="organization" placeholder="例：〇〇食堂" /></Field>
            <Field label="注文内容・体験"><textarea className="textarea h-32 w-full" name="experience" required maxLength={3000} placeholder="食べた料理、味、価格、店内の様子など、事実を自由に入力" /></Field>
            <Field label="評価"><input className="input w-full" name="rating" type="number" required min={0} max={5} step={0.1} inputMode="decimal" placeholder="4.0" /></Field>
            <Field label="日記・個人的エピソード" optional><textarea className="textarea h-32 w-full" name="personalEpisode" maxLength={2000} placeholder="誰と行ったか、その日にあったことなど" /></Field>
            <button className="btn btn-primary" type="submit" disabled={isLoading}>{isLoading ? "生成中…" : "口コミを生成する"}</button>
            <p className={`min-h-6 text-sm ${status.isError ? "text-error" : "opacity-60"}`} role="status" aria-live="polite">{status.message}</p>
          </form>
        </section>

        {result && (
          <section className="card mt-6 bg-base-100 shadow-sm" aria-labelledby="result-title">
            <div className="card-body">
              <h2 id="result-title" className="card-title">生成した下書き</h2>
              <p className="font-bold">{result.title}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{result.body}</p>
              <div className="card-actions mt-4 items-center justify-between">
                <p className="text-sm opacity-60">{result.notice}</p>
                <button className="btn btn-neutral" type="button" onClick={copy}>コピー</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="fieldset">
      <span className="fieldset-legend">{label}{optional && <span className="font-normal opacity-60">任意</span>}</span>
      {children}
    </label>
  );
}
