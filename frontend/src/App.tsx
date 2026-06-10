import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./pages/auth/LoginForm";
import DoctorDashboard from "./pages/doctor/DoctorDashboard.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import PublicHomePage from "./pages/PublicHomePage.tsx";
import PatientDashboard from "./pages/patient/PatientDashboard.tsx";
import NutritionistDashboard from "./pages/nutritionniste/NutritionistDashboard.tsx";
import ArticleEditorPage from "./pages/article/ArticleEditorPage.tsx";
import PathologyPage from "./pages/article/PathologyPage.tsx";
import ArticlePage from "./pages/article/ArticlePage.tsx";
import RegisterPatientPage from "./pages/auth/RegisterPatientPage.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute";

<Route path="/PublicHomePage" element={<PublicHomePage />} />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register/patient" element={<RegisterPatientPage />} />
        <Route element={<ProtectedRoute allowedRoles={["MEDECIN"]} />}>
          <Route path="/medecin" element={<DoctorDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/patient" element={<PatientDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["NUTRITIONNISTE"]} />}>
          <Route path="/nutritionniste" element={<NutritionistDashboard />} />
          <Route
            path="/nutritionniste/articles/:id"
            element={<ArticleEditorPage />}
          />
        </Route>
        <Route path="/nutrition/:pathology" element={<PathologyPage />} />
        <Route path="/nutrition/article/:articleId" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  );
}
