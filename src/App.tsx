import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentDocument } from './types';
import { INITIAL_DOCUMENTS } from './data/mockDocuments';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentRegisterPage } from './pages/StudentRegisterPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminRegisterPage } from './pages/AdminRegisterPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminReviewPage } from './pages/AdminReviewPage';

export default function App() {
  const [documents, setDocuments] = useState<StudentDocument[]>(INITIAL_DOCUMENTS);

  const handleUploadSuccess = (newDoc: StudentDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Student Public Authentication Routes */}
          <Route path="/student/login" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/student/login" replace />} />
          <Route path="/student/register" element={<StudentRegisterPage />} />

          {/* Admin Public Authentication Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />

          {/* Protected Student Portal Routes */}
          <Route
            path="/student/portal"
            element={<Navigate to="/student/dashboard" replace />}
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboardPage
                  documents={documents}
                  onUploadSuccess={handleUploadSuccess}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/documents/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboardPage
                  documents={documents}
                  onUploadSuccess={handleUploadSuccess}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboardPage
                  documents={documents}
                  onUploadSuccess={handleUploadSuccess}
                />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Portal Routes */}
          <Route
            path="/admin/portal"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/review/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Main Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
