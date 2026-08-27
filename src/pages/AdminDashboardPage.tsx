import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StudentDocument, VerificationStatus } from '../types';
import { 
  getVerificationQueue, 
  computeAdminStats, 
  AdminSummaryStats 
} from '../services/adminDocumentService';
import { AdminNavbar } from '../components/AdminNavbar';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Search, 
  Filter, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Eye,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [stats, setStats] = useState<AdminSummaryStats>({
    totalDocuments: 0,
    pendingReview: 0,
    valid: 0,
    suspicious: 0,
    rejected: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load documents from service
  const loadQueue = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getVerificationQueue();
      setDocuments(data);
      setStats(computeAdminStats(data));
    } catch (err: any) {
      console.error('Failed to load verification queue:', err);
      setErrorMessage(err.message || 'Unable to load verification data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // Filter and search logic
  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) return matchesStatus;

    const matchesSearch = 
      doc.title.toLowerCase().includes(query) ||
      doc.fileName.toLowerCase().includes(query) ||
      doc.studentName.toLowerCase().includes(query) ||
      doc.studentId.toLowerCase().includes(query) ||
      doc.documentType.toLowerCase().includes(query) ||
      doc.institution.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Valid</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Suspicious</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreBadge = (score: number, status: VerificationStatus) => {
    let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score < 60 || status === 'rejected') {
      colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    } else if (score < 85 || status === 'suspicious') {
      colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black border ${colorClass}`}>
          {score}%
        </span>
        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
          <div 
            className={`h-full rounded-full ${
              score < 60 ? 'bg-rose-500' : score < 85 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '11s' }} />
      </div>

      {/* Admin Navbar */}
      <AdminNavbar />

      {/* Main Dashboard Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 w-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Admin Verification Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Review submitted documents, inspect verification results, and manage document authenticity decisions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadQueue}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Total Documents */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl space-y-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {stats.totalDocuments}
            </div>
            <p className="text-[11px] text-slate-500">Submitted by students</p>
          </motion.div>

          {/* Pending Review */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-sky-500/30 hover:border-sky-500/50 shadow-xl space-y-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
              {stats.pendingReview}
            </div>
            <p className="text-[11px] text-slate-500">Waiting for review</p>
          </motion.div>

          {/* Valid */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/50 shadow-xl space-y-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Valid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {stats.valid}
            </div>
            <p className="text-[11px] text-slate-500">Authentic credentials</p>
          </motion.div>

          {/* Suspicious */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/50 shadow-xl space-y-2 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Suspicious</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {stats.suspicious}
            </div>
            <p className="text-[11px] text-slate-500">Requires examination</p>
          </motion.div>

          {/* Rejected */}
          <motion.div
            whileHover={{ y: -2 }}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-rose-500/30 hover:border-rose-500/50 shadow-xl space-y-2 relative overflow-hidden col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
              {stats.rejected}
            </div>
            <p className="text-[11px] text-slate-500">Failed verification</p>
          </motion.div>

        </section>

        {/* Verification Queue Section */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          
          {/* Section Header & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Verification Queue
              </h2>
              <p className="text-xs text-slate-400">
                Review recently submitted documents and inspect their verification results.
              </p>
            </div>

            {/* Search and Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* Search documents */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Status Filter Dropdown / Pills */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs gap-1 overflow-x-auto">
                <button
                  id="filter-status-all"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  id="filter-status-pending"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-slate-900'
                  }`}
                >
                  Pending ({stats.pendingReview})
                </button>
                <button
                  id="filter-status-valid"
                  onClick={() => setStatusFilter('valid')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'valid'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
                  }`}
                >
                  Valid ({stats.valid})
                </button>
                <button
                  id="filter-status-suspicious"
                  onClick={() => setStatusFilter('suspicious')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'suspicious'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
                  }`}
                >
                  Suspicious ({stats.suspicious})
                </button>
                <button
                  id="filter-status-rejected"
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    statusFilter === 'rejected'
                      ? 'bg-rose-500 text-white font-black'
                      : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
                  }`}
                >
                  Rejected ({stats.rejected})
                </button>
              </div>

            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={loadQueue}
                className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Verification Table */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Loading verification queue...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-950/50 rounded-2xl border border-slate-800/80">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                No documents are currently waiting for review.
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No documents matched your search filter criteria. Try adjusting your search query or status filter.'
                  : 'All submitted student documents have been processed and resolved.'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm">
                
                {/* Table Header */}
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Document</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Document Type</th>
                    <th className="py-3.5 px-4">Uploaded Date</th>
                    <th className="py-3.5 px-4">Authenticity Score</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>

                {/* Table Rows */}
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-sans">
                  {filteredDocuments.map((doc) => (
                    <tr 
                      key={doc.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Document Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate max-w-xs sm:max-w-sm">
                              {doc.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{doc.id}</span>
                              <span>•</span>
                              <span className="text-slate-500 truncate max-w-[140px]">{doc.institution}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Student Information */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">
                          {doc.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {doc.studentId}
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium whitespace-nowrap">
                          {doc.documentType}
                        </span>
                      </td>

                      {/* Uploaded Date */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap text-xs">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Authenticity Score */}
                      <td className="py-3.5 px-4">
                        {getScoreBadge(doc.authenticityScore, doc.status)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>

                      {/* Review Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          id={`btn-review-${doc.id}`}
                          to={`/admin/review/${doc.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-slate-500 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span>VeriDoc AI • Institutional Admin Verification Console</span>
          <span>Administrator Access Provisioned</span>
        </div>
      </footer>

    </div>
  );
};
