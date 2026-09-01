import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import TraineeApplyPage from './pages/TraineeApplyPage.jsx';
import JobApplyPage from './pages/JobApplyPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CompaniesPage from './pages/CompaniesPage.jsx';
import BatchesPage from './pages/BatchesPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/apply/trainee" element={<TraineeApplyPage />} />
      <Route path="/apply/job" element={<JobApplyPage />} />
      <Route path="/pay" element={<PaymentPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
      <Route path="/admin/batches" element={<ProtectedRoute><BatchesPage /></ProtectedRoute>} />
    </Routes>
  );
}