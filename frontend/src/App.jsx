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
import { getCurrentUser } from './auth/roles';

const ProtectedRoute = () => {
  if (!localStorage.getItem('token') || !getCurrentUser()) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />;
};

const RoleRoute = ({ roles, children }) => (
  roles.includes(getCurrentUser()?.role) ? children : <Navigate to="/" replace />
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="patients/:id/history" element={<RoleRoute roles={['PATIENT', 'DOCTOR', 'STAFF', 'ADMIN']}><PatientHistory /></RoleRoute>} />
          <Route path="lab" element={<RoleRoute roles={['PATIENT', 'DOCTOR', 'STAFF', 'ADMIN']}><LabDashboard /></RoleRoute>} />
          <Route path="pharmacy" element={<RoleRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}><PharmacyDashboard /></RoleRoute>} />
          <Route path="appointments/book" element={<RoleRoute roles={['PATIENT', 'STAFF', 'ADMIN']}><BookAppointment /></RoleRoute>} />
          <Route path="billing" element={<RoleRoute roles={['STAFF', 'ADMIN']}><BillingPage /></RoleRoute>} />
          <Route path="clinical" element={<RoleRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}><ClinicalPrecision /></RoleRoute>} />
          <Route path="patients" element={<RoleRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}><PatientsPage /></RoleRoute>} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
