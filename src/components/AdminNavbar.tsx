import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  LogOut, 
  User, 
  LayoutDashboard
} from 'lucide-react';

interface AdminNavbarProps {
  currentSection?: string;
  showBackToDashboard?: boolean;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ 
  showBackToDashboard = false 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/20 text-slate-100 shadow-xl shadow-cyan-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Branding */}
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                VeriDoc AI
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Document Authenticity Verification</p>
            </div>
          </Link>

          {/* Center: Admin Console Title / Quick Link */}
          <div className="flex items-center gap-2">
            {showBackToDashboard ? (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verification Queue</span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-inner">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Admin Verification Console</span>
              </div>
            )}
          </div>

          {/* Right: Admin Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-cyan-400/90 font-mono">
                {user?.email || 'admin@cbse.nic.in'}
              </span>
            </div>

            <button
              id="admin-navbar-logout-btn"
              onClick={handleLogout}
              className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Log out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
