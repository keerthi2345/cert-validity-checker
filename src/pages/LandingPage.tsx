import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { downloadProjectZip } from '../utils/exportProject';
import { 
  ShieldCheck, 
  GraduationCap, 
  ShieldAlert, 
  LogIn, 
  UserPlus, 
  FileCheck, 
  Search, 
  Cpu, 
  Layers, 
  Sparkles,
  Download,
  Check,
  FolderArchive
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleExportZip = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);
    try {
      const ok = await downloadProjectZip();
      if (ok !== false) {
        setDownloadSuccess(true);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
      setTimeout(() => setDownloadSuccess(false), 5000);
    }
  };

  // If already authenticated, redirect to their respective dashboard
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-emerald-500/20 text-slate-100 shadow-2xl shadow-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Branding & Subtitle */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
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
            </Link>

            {/* Center Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <a href="#hero" className="hover:text-emerald-400 transition-colors">Home</a>
              <a href="#portals" className="hover:text-emerald-400 transition-colors">Student & Admin</a>
              <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            </nav>

            {/* Right Quick Access Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Temporary Development-Only Export Button */}
              <button
                id="temporary-dev-download-zip-btn"
                onClick={handleExportZip}
                disabled={isExporting}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-500/40 hover:to-teal-500/40 border border-emerald-500/50 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50 animate-pulse"
                title="Temporary Development Export: Download complete veridoc-ai-source-code.zip"
              >
                {isExporting ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>Packaging ZIP...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ZIP Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Project ZIP</span>
                  </>
                )}
              </button>

              <Link
                to="/student/login"
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 hover:text-emerald-300 transition-all flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Student Login</span>
                <span className="sm:hidden">Student</span>
              </Link>
              <Link
                to="/admin/login"
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-all flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20 w-full">
        
        {/* Hero Section */}
        <section id="hero" className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institutional Document Verification Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight sm:leading-tight"
          >
            Academic Document <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Authenticity Verification System
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Securely upload, verify, and track the authenticity of academic and official documents.
          </motion.p>

          {/* Development-Only Export Banner / Action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl shadow-emerald-950/30 max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>Development Source Code Export</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  veridoc-ai-source-code.zip
                </div>
              </div>
            </div>

            <button
              id="hero-dev-download-zip-btn"
              onClick={handleExportZip}
              disabled={isExporting}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 animate-spin" />
                  <span>Packaging...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Download Project ZIP</span>
                </>
              )}
            </button>
          </motion.div>
        </section>

        {/* Role Selection Cards */}
        <section id="portals" className="w-full max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Select Your Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Choose your role below to log in or create a new account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Student Portal Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-emerald-950/30 flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Student Role
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Student Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Upload your academic documents and track their verification status and authenticity results.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Upload marksheets, degrees, and certificates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Real-time verification status and authenticity score</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Comprehensive document history & verification details</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  id="btn-student-login-main"
                  to="/student/login"
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Student Login</span>
                </Link>

                <Link
                  id="btn-student-register-main"
                  to="/student/register"
                  className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.2]" />
                  <span>Student Register</span>
                </Link>
              </div>
            </motion.div>

            {/* Admin Portal Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-cyan-950/30 flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
                    Admin Role
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Admin Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Review submitted documents and manage verification decisions.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>Audit submission queue and inspection backlog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Institutional verification oversight and review</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Approve, flag suspicious, or reject anomalous credentials</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  id="btn-admin-login-main"
                  to="/admin/login"
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Admin Login</span>
                </Link>

                <Link
                  id="btn-admin-register-main"
                  to="/admin/register"
                  className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.2]" />
                  <span>Admin Register</span>
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full max-w-4xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              How Document Verification Works
            </h2>
            <p className="text-xs text-slate-400">
              A 3-step automated and forensic verification workflow
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-100">Document Ingestion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Students upload PDF, PNG, or JPG credentials. Text, seals, and layout templates are extracted automatically.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-100">Forensic Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The engine evaluates font kerning, image compression boundaries, margin alignment, and metadata consistency.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-100">Authenticity Result</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                An authenticity score and status (Valid, Pending, Suspicious, or Rejected) are assigned with detailed findings.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-slate-500 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span className="font-semibold text-slate-400">
            VeriDoc AI • Academic Document Authenticity Verification System
          </span>
          <span className="text-slate-500">
            Secure Document Ingestion & Institutional Verification Portal
          </span>
        </div>
      </footer>

    </div>
  );
};
