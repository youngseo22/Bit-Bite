import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./private";
import { Layout } from "@/components/Layout";
import { HomePage } from "@/pages/HomePage";
import { QuestionPage } from "@/pages/QuestionPage";
import { FeedbackPage } from "@/pages/FeedbackPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "@/pages/AdminPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="question/:id" element={<QuestionPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
