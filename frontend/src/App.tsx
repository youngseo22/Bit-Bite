import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { HomePage } from "@/pages/HomePage";
import { QuestionPage } from "@/pages/QuestionPage";
import { FeedbackPage } from "@/pages/FeedbackPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="question/:category/:day" element={<QuestionPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
    </Routes>
  );
}

export default App;
