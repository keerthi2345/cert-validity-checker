import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['student']
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10 animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Verifying session credentials...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    const isTargetingAdmin = allowedRoles.includes('admin') && !allowedRoles.includes('student');
    const loginTarget = isTargetingAdmin ? '/admin/login' : '/student/login';
    return <Navigate to={loginTarget} state={{ from: location }} replace />;
  }

  // Role mismatch protection
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If student tries to access admin route, redirect to student dashboard
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // If admin tries to access student route, redirect to admin dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Fallback
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
