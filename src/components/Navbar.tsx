import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  GraduationCap, 
  FileUp, 
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUpload }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/student/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-emerald-500/20 text-slate-100 shadow-2xl shadow-emerald-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Branding & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              </span>
            </div>

            <div>
              <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                VeriDoc AI
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Document Authenticity Verification</p>
            </div>
          </div>

          {/* Center: Student Portal Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs font-semibold text-emerald-300 shadow-inner">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Student Portal</span>
          </div>

          {/* Right: Actions, Profile, and Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Upload Document Action */}
            <motion.button
              id="navbar-upload-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <FileUp className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Upload Document</span>
              <span className="xs:hidden">Upload</span>
            </motion.button>

            {/* Student Profile / Name */}
            {user && (
              <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] border border-emerald-500/30">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white leading-tight truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono leading-tight">
                    {user.studentId || 'Student'}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Action */}
            <motion.button
              id="navbar-logout-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              title="Logout from Student Portal"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>

          </div>

        </div>
      </div>
    </header>
  );
};
