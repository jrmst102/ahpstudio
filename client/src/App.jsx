import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProblemProvider } from './context/ProblemContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProblemEditor from './pages/ProblemEditor';
import AdminPanel from './pages/AdminPanel';
import AccountSettings from './pages/AccountSettings';
import AboutPage from './pages/AboutPage';
import WhatIsAHPPage from './pages/WhatIsAHPPage';
import WhyAHPPage from './pages/WhyAHPPage';
import HelpPage from './pages/HelpPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ParticipatePage from './pages/ParticipatePage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProblemProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:problemId?"
              element={
                <ProtectedRoute>
                  <ProblemEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <AboutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/what-is-ahp"
              element={
                <ProtectedRoute>
                  <WhatIsAHPPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/why-ahp"
              element={
                <ProtectedRoute>
                  <WhyAHPPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpPage />
                </ProtectedRoute>
              }
            />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/participate/:problemId/:token" element={<ParticipatePage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ProblemProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
