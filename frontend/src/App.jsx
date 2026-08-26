import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PatientHistory from './pages/PatientHistory';
import LabDashboard from './pages/LabDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import BookAppointment from './pages/BookAppointment';
import BillingPage from './pages/BillingPage';
import ClinicalPrecision from './pages/ClinicalPrecision';
import NotFound from './pages/NotFound';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';

const ProtectedRoute = () => {
  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="patients/:id/history" element={<PatientHistory />} />
          <Route path="lab" element={<LabDashboard />} />
          <Route path="pharmacy" element={<PharmacyDashboard />} />
          <Route path="appointments/book" element={<BookAppointment />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="clinical" element={<ClinicalPrecision />} />
          {/* Fallback for empty paths */}
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          {/* Catch-all route for 404s */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
