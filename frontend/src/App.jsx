import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ElderlyDashboard from './pages/ElderlyDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import MedicationManagement from './pages/MedicationManagement';
import MedicationHistory from './pages/MedicationHistory';
import HealthMonitoring from './pages/HealthMonitoring';
import AICareAssistant from './pages/AICareAssistant';
import EmergencyContactsPage from './pages/EmergencyContactsPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If wrong role, redirect to appropriate home
    return <Navigate to={user?.role === 'caregiver' ? '/caregiver-dashboard' : '/dashboard'} replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main Authenticated Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Role-Specific Dashboards */}
        <Route 
          path="/dashboard" 
          element={
            user?.role === 'caregiver' ? (
              <Navigate to="/caregiver-dashboard" replace />
            ) : (
              <ElderlyDashboard />
            )
          } 
        />
        <Route 
          path="/caregiver-dashboard" 
          element={
            <ProtectedRoute requiredRole="caregiver">
              <CaregiverDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Feature Modules */}
        <Route path="/medications" element={<MedicationManagement />} />
        <Route path="/history" element={<MedicationHistory />} />
        <Route path="/health" element={<HealthMonitoring />} />
        <Route path="/assistant" element={<AICareAssistant />} />
        <Route path="/emergency" element={<EmergencyContactsPage />} />
        <Route path="/settings" element={<ProfileSettingsPage />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
