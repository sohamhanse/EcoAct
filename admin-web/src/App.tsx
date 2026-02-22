import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { useAuth } from "./lib/auth";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { EventsPage } from "./pages/EventsPage";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { QuizzesPage } from "./pages/QuizzesPage";

function ProtectedApp() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}
