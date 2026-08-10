export type Review = {
  id: string;
  name: string;
  url: string;
  detailUrl: string;
  title: string | null;
  body: string | null;
  reviewDate: string;
  rating: number;
  likeCount: number;
};
