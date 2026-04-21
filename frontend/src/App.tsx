import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from './components/LoginForm';
import DoctorDashboard from "./components/DoctorDashboard";
import PublicHomePage from "./components/PublicHomePage";
import PatientDashboard from "./components/PatientDashboard";
import NutritionistDashboard from "./components/NutritionistDashboard";
import PathologyPage from "./components/PathologyPage";
import ArticlePage from "./components/ArticlePage";
import RegisterPatientPage from "./components/RegisterPatientPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register/patient" element={<RegisterPatientPage />} />
        <Route path="/medecin" element={<DoctorDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/nutritionniste" element={<NutritionistDashboard />} />
        <Route path="/nutrition/:pathology" element={<PathologyPage />} />
        <Route path="/nutrition/article/:articleId" element={<ArticlePage />} />
      </Routes>
    </BrowserRouter>
  );
}
