import { Navigate, Route, Routes } from "react-router";
import { ReviewCreatePage } from "./pages/ReviewCreatePage";
import { ReviewListPage } from "./pages/ReviewListPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/reviews" replace />} />
      <Route path="/reviews" element={<ReviewListPage />} />
      <Route path="/reviews/new" element={<ReviewCreatePage />} />
      <Route path="*" element={<Navigate to="/reviews" replace />} />
    </Routes>
  );
}
