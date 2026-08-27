import React, { useState } from 'react';
import { StudentDocument } from '../types';
import { 
  FileUp, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  Search, 
  FileCheck2,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentPortalProps {
  documents: StudentDocument[];
  onOpenUploadModal: () => void;
  onSelectDocument: (doc: StudentDocument) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  documents,
  onOpenUploadModal,
  onSelectDocument
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dragOver, setDragOver] = useState(false);

  const studentDocuments = documents;

  const filteredDocs = studentDocuments.filter(doc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      doc.title.toLowerCase().includes(term) ||
      doc.documentType.toLowerCase().includes(term) ||
      doc.institution.toLowerCase().includes(term) ||
      doc.id.toLowerCase().includes(term);

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && doc.status === statusFilter;
  });

  const validCount = studentDocuments.filter(d => d.status === 'valid').length;
  const pendingCount = studentDocuments.filter(d => d.status === 'pending').length;
  const suspiciousCount = studentDocuments.filter(d => d.status === 'suspicious').length;
  const rejectedCount = studentDocuments.filter(d => d.status === 'rejected').length;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onOpenUploadModal();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Student Profile & Summary Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/30 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Zap className="w-3 h-3 text-emerald-400" />
                Student Portal
              </span>
              <span className="text-slate-400 text-xs font-mono">Academic Year 2025-2026</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Academic Document <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Verification Dashboard</span>
            </h1>
            
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Upload marksheets, degree certificates, and academic documents for automated verification, OCR entity extraction, structural validation, and forensic analysis.
            </p>
          </div>

          {/* 5 Summary Cards Grid: Total Documents, Valid, Pending, Suspicious, Rejected */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 w-full md:w-auto">
            {/* Total Documents */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 text-center shadow-lg"
            >
              <div className="text-2xl font-black text-white font-mono">{studentDocuments.length}</div>
              <div className="text-[11px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap">Total Documents</div>
            </motion.div>

            {/* Valid */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-3 text-center shadow-lg shadow-emerald-950/40"
            >
              <div className="text-2xl font-black text-emerald-400 font-mono">{validCount}</div>
              <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">Valid</div>
            </motion.div>

            {/* Pending */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-3 text-center shadow-lg shadow-blue-950/40"
            >
              <div className="text-2xl font-black text-blue-400 font-mono">{pendingCount}</div>
              <div className="text-[11px] text-blue-300 font-semibold mt-0.5">Pending</div>
            </motion.div>

            {/* Suspicious */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 text-center shadow-lg shadow-amber-950/40"
            >
              <div className="text-2xl font-black text-amber-400 font-mono">{suspiciousCount}</div>
              <div className="text-[11px] text-amber-300 font-semibold mt-0.5">Suspicious</div>
            </motion.div>

            {/* Rejected */}
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-3 text-center shadow-lg shadow-rose-950/40 col-span-2 sm:col-span-1"
            >
              <div className="text-2xl font-black text-rose-400 font-mono">{rejectedCount}</div>
              <div className="text-[11px] text-rose-300 font-semibold mt-0.5">Rejected</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Large Centered Document Upload Area (Full Width & Clean) */}
      <div className="w-full">
        <motion.div
          id="drag-drop-upload-zone"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => onOpenUploadModal()}
          className={`w-full border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden ${
            dragOver
              ? 'border-emerald-400 bg-emerald-950/40 shadow-2xl shadow-emerald-500/30'
              : 'border-emerald-500/30 bg-slate-900/60 hover:bg-slate-900/90 hover:border-emerald-400/60 shadow-xl'
          }`}
        >
          {/* Subtle Scanning Laser Line */}
          <motion.div 
            animate={{ y: [0, 160, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 pointer-events-none shadow-[0_0_12px_#22d3ee]"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Drag and drop your academic documents here
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-lg leading-relaxed">
            Supports <strong className="text-emerald-300 font-bold">PDF, JPG, PNG</strong> files up to 25MB. Upload marksheets, degree certificates, migration certificates, and bonafide documents for verification.
          </p>

          <button
            id="browse-files-btn"
            type="button"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105"
          >
            <FileUp className="w-4 h-4 stroke-[2.5]" />
            <span>Browse Local Files</span>
          </button>
        </motion.div>
      </div>

      {/* Uploaded Document History & Verification Status Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
        
        {/* Filter & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              Uploaded Document History & Verification Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track your uploaded documents, verification status, and authenticity results.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="student-doc-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              id="student-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses ({studentDocuments.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="valid">Valid ({validCount})</option>
              <option value="suspicious">Suspicious ({suspiciousCount})</option>
              <option value="rejected">Rejected ({rejectedCount})</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] bg-slate-950/60">
                <th className="py-3 px-4">Document Details</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Authenticity Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-medium text-slate-300">No documents found matching your criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">Upload a new document or modify your search filter.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr 
                    key={doc.id}
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    {/* Document Title & Size */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[240px]">{doc.title}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ID: {doc.id} • {doc.fileSize}
                      </div>
                    </td>

                    {/* Document Type */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {doc.documentType}
                    </td>

                    {/* Institution */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-semibold text-slate-200">{doc.institution}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Roll No: {doc.studentId}</div>
                    </td>

                    {/* Uploaded Date */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Authenticity Score & Bar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-black text-xs ${
                          doc.authenticityScore >= 80 ? 'text-emerald-400' :
                          doc.authenticityScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {doc.authenticityScore}%
                        </span>
                        <div className="w-16 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            style={{ width: `${doc.authenticityScore}%` }}
                            className={`h-full rounded-full ${
                              doc.authenticityScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                              doc.authenticityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {doc.riskLevel}
                      </span>
                    </td>

                    {/* Status Badge (Pending=Blue, Valid=Green, Suspicious=Orange/Yellow, Rejected=Red) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        doc.status === 'valid' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                        doc.status === 'suspicious' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                        doc.status === 'rejected' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                        'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}>
                        {doc.status === 'valid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {doc.status === 'suspicious' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {doc.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {doc.status === 'pending' && <Clock className="w-3.5 h-3.5 text-blue-400" />}
                        <span className="capitalize">{doc.status}</span>
                      </span>
                    </td>

                    {/* Actions ("View Details") */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          id={`view-details-btn-${doc.id}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSelectDocument(doc)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 hover:border-emerald-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
