import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./pages/auth/LoginForm";
import DoctorDashboard from "./components/DoctorDashboard";
import PublicHomePage from "./components/PublicHomePage";
import PatientDashboard from "./components/PatientDashboard";
import NutritionistDashboard from "./components/NutritionistDashboard";
import PathologyPage from "./components/PathologyPage.tsx";
import ArticlePage from "./components/ArticlePage.tsx";
import RegisterPatientPage from "./components/RegisterPatientPage.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/patient" element={<PatientDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["NUTRITIONNISTE"]} />}>
          <Route path="/nutritionniste" element={<NutritionistDashboard />} />
        </Route>
        <Route path="/nutrition/:pathology" element={<PathologyPage />} />
        <Route path="/nutrition/article/:articleId" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  );
}
