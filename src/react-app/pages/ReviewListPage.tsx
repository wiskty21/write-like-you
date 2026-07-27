import { useEffect, useState } from "react";
import { Link } from "react-router";

type Review = {
  name: string;
  url: string;
  title: string | null;
  body: string | null;
  rating: number;
  likeCount: number;
};

type ReviewsResponse = {
  reviews: Review[];
  lastUpdatedAt: string | null;
};

export function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews");

        if (!response.ok) {
          throw new Error("口コミの取得に失敗しました。");
        }

        const data = (await response.json()) as ReviewsResponse;
        setReviews(data.reviews);
        setLastUpdatedAt(data.lastUpdatedAt);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "口コミの取得に失敗しました。",
        );
      }
    }

    void loadReviews();
  }, []);

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (!reviews) {
    return <p>読み込み中...</p>;
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-10" data-theme="cupcake">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">口コミ一覧</h1>
            <p className="mt-2 opacity-70">{reviews.length}件の口コミ</p>
            <p className="mt-1 text-sm opacity-60">
              最終取得：
              {lastUpdatedAt
                ? new Intl.DateTimeFormat("ja-JP", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(lastUpdatedAt))
                : "未実行"}
            </p>
          </div>

          <Link className="btn btn-primary" to="/reviews/new">
            口コミを作成
          </Link>
        </header>

        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.url}>
              <article className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="flex items-start justify-between gap-4">
                    <a
                      className="link text-xl font-bold"
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {review.name}
                    </a>

                    <span className="badge badge-primary">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>

                  {review.title && (
                    <h2 className="font-bold">{review.title}</h2>
                  )}

                  {review.body && (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {review.body}
                    </p>
                  )}

                  <p className="text-sm opacity-60">
                    いいね {review.likeCount}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
