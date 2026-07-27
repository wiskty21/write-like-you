import { useEffect, useState } from "react";

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
};

export function ReviewListPage() {
  const [reviews, setReviews] = useState<Review[]>();
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

  return <p>{reviews.length}件の口コミ</p>;
}
