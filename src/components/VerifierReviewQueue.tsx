import React, { useState } from 'react';
import { StudentDocument, BoundingBox, AuditComment, VerificationStatus, UserRole } from '../types';
import { DocumentCanvasPreview } from './DocumentCanvasPreview';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  FileText, 
  Layers, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Send, 
  UserCheck, 
  RotateCcw, 
  ExternalLink, 
  Sparkles, 
  Info, 
  Tag, 
  Plus, 
  ArrowUpRight,
  FileSpreadsheet,
  Cpu,
  Zap,
  Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface VerifierReviewQueueProps {
  documents: StudentDocument[];
  currentRole: UserRole;
  onUpdateDocumentStatus: (
    docId: string, 
    status: VerificationStatus, 
    comment?: string,
    rejectionReason?: string
  ) => void;
  onOpenReportModal: (doc: StudentDocument) => void;
}

export const VerifierReviewQueue: React.FC<VerifierReviewQueueProps> = ({
  documents,
  currentRole,
  onUpdateDocumentStatus,
  onOpenReportModal
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[1]?.id || documents[0]?.id || '');
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'suspicious' | 'valid' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Layer toggles for Document Viewer
  const [activeLayers, setActiveLayers] = useState({
    scan: true,
    anomalies: true,
    ocr: false,
    ela: false,
    grid: false
  });

  // Selected bounding box for deep inspector
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);

  // Verifier comment input
  const [commentText, setCommentText] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Font and typography splicing identified on recipient name and grade values.');

  const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const filteredQueue = documents.filter(doc => {
    const matchesSearch = 
      doc.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());

    if (queueFilter === 'all') return matchesSearch;
    return matchesSearch && doc.status === queueFilter;
  });

  const handleApprove = () => {
    if (!activeDoc) return;
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    onUpdateDocumentStatus(
      activeDoc.id, 
      'valid', 
      `Approved by Administrator. Authenticity confirmed.`
    );
  };

  const handleRejectConfirm = () => {
    if (!activeDoc) return;
    onUpdateDocumentStatus(
      activeDoc.id, 
      'rejected', 
      `Rejected due to document integrity violation.`,
      rejectionReason
    );
    setRejectModalOpen(false);
  };

  const handleFlagSuspicious = () => {
    if (!activeDoc) return;
    onUpdateDocumentStatus(
      activeDoc.id, 
      'suspicious', 
      `Flagged as suspicious for manual verification examination.`
    );
  };

  const handleRequestResubmission = () => {
    if (!activeDoc) return;
    onUpdateDocumentStatus(
      activeDoc.id, 
      'pending', 
      `Re-submission requested: Please upload an uncompressed 300+ DPI color scan.`
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeDoc) return;
    
    const newComment: AuditComment = {
      id: `comm-${Date.now()}`,
      authorName: 'System Administrator',
      authorRole: currentRole,
      timestamp: new Date().toISOString(),
      text: commentText.trim()
    };
    activeDoc.comments.push(newComment);
    setCommentText('');
  };

  const handleAddManualAnnotation = (boxData: Omit<BoundingBox, 'id'>) => {
    if (!activeDoc) return;
    const newBox: BoundingBox = {
      ...boxData,
      id: `box-manual-${Date.now()}`
    };
    activeDoc.suspiciousRegions.push(newBox);
    setSelectedBoxId(newBox.id);
    setIsAnnotationMode(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Workspace Header with Emerald Glow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Forensic Anomaly Review & Inspection Workspace
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Interactive Viewer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-resolution document canvas, ELA compression noise filter, neural OCR entity reconciliation, and audit log.
            </p>
          </div>
        </div>

        {/* Action button */}
        {activeDoc && (
          <div className="flex items-center gap-2">
            <motion.button
              id="btn-open-full-forensic-report"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenReportModal(activeDoc)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-500/30 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Full Forensic Dossier</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Review Queue (3 of 12 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          
          {/* Queue Filter Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Review Queue ({filteredQueue.length})
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync
              </span>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setQueueFilter('all')}
                className={`py-1 rounded-lg transition-colors ${queueFilter === 'all' ? 'bg-emerald-600 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All ({documents.length})
              </button>
              <button
                onClick={() => setQueueFilter('suspicious')}
                className={`py-1 rounded-lg transition-colors ${queueFilter === 'suspicious' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Suspicious ({documents.filter(d => d.status === 'suspicious').length})
              </button>
              <button
                onClick={() => setQueueFilter('pending')}
                className={`py-1 rounded-lg transition-colors ${queueFilter === 'pending' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Pending ({documents.filter(d => d.status === 'pending').length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="verifier-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, university..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Queue Item List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredQueue.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <motion.div
                  key={doc.id}
                  id={`queue-item-${doc.id}`}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setSelectedBoxId(null);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-slate-100 truncate max-w-[180px]">
                      {doc.studentName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      doc.authenticityScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                      doc.authenticityScore >= 50 ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {doc.authenticityScore}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate mb-2">
                    {doc.institution} • <span className="text-slate-500">{doc.documentType}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      {doc.status === 'valid' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {doc.status === 'suspicious' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      {doc.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-400" />}
                      {doc.status === 'pending' && <Clock className="w-3 h-3 text-blue-400" />}
                      <span className="capitalize text-slate-300">{doc.status}</span>
                    </span>

                    {doc.suspiciousRegions.length > 0 && (
                      <span className="text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/50 font-bold">
                        {doc.suspiciousRegions.length} anomalies
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* Center Column: Interactive Document Canvas (6 of 12 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Layer Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300 shadow-md">
            <div className="flex items-center gap-2 font-bold text-white">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Forensic Layers:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Anomalies Layer Toggle */}
              <button
                id="layer-toggle-anomalies"
                onClick={() => setActiveLayers(prev => ({ ...prev, anomalies: !prev.anomalies }))}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  activeLayers.anomalies
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {activeLayers.anomalies ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Anomalies ({activeDoc?.suspiciousRegions.length || 0})</span>
              </button>

              {/* OCR Layer Toggle */}
              <button
                id="layer-toggle-ocr"
                onClick={() => setActiveLayers(prev => ({ ...prev, ocr: !prev.ocr }))}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  activeLayers.ocr
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {activeLayers.ocr ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>OCR Boxes</span>
              </button>

              {/* ELA Thermal Filter Toggle */}
              <button
                id="layer-toggle-ela"
                onClick={() => setActiveLayers(prev => ({ ...prev, ela: !prev.ela }))}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  activeLayers.ela
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>ELA Noise Map</span>
              </button>

              {/* Grid Toggle */}
              <button
                id="layer-toggle-grid"
                onClick={() => setActiveLayers(prev => ({ ...prev, grid: !prev.grid }))}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  activeLayers.grid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Grid</span>
              </button>

              {/* Add Annotation Button */}
              <button
                id="btn-add-annotation-mode"
                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                  isAnnotationMode
                    ? 'bg-emerald-500 text-slate-950 font-black animate-pulse'
                    : 'bg-slate-950 text-emerald-400 border border-emerald-500/40 hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAnnotationMode ? 'Drawing...' : 'Annotate'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Document Canvas */}
          {activeDoc ? (
            <div className="h-[740px]">
              <DocumentCanvasPreview
                document={activeDoc}
                activeLayers={activeLayers}
                selectedBoxId={selectedBoxId}
                onSelectBox={(id) => setSelectedBoxId(id)}
                onAddAnnotation={handleAddManualAnnotation}
                isAnnotationMode={isAnnotationMode}
              />
            </div>
          ) : (
            <div className="h-[600px] bg-slate-900/60 rounded-3xl border border-slate-800 flex items-center justify-center text-slate-500 text-sm">
              Select a document from the queue to start review.
            </div>
          )}

        </div>

        {/* Right Column: Suspicious Regions Inspector & Actions (3 of 12 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Quick Verdict Card */}
          {activeDoc && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Authenticity Verdict
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeDoc.riskLevel === 'LOW RISK' ? 'bg-emerald-500/20 text-emerald-300' :
                  activeDoc.riskLevel === 'MEDIUM RISK' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-rose-500/20 text-rose-300'
                }`}>
                  {activeDoc.riskLevel}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className={`text-3xl font-black font-mono ${
                  activeDoc.authenticityScore >= 80 ? 'text-emerald-400' :
                  activeDoc.authenticityScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {activeDoc.authenticityScore}%
                </div>
                <div className="text-xs text-slate-400 leading-tight">
                  Status: <strong className="text-slate-200 block">{activeDoc.explanation.verdict}</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                {activeDoc.explanation.executiveSummary}
              </p>
            </div>
          )}

          {/* Suspicious Regions List */}
          {activeDoc && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Flagged Regions ({activeDoc.suspiciousRegions.length})
                </span>
                <span className="text-[10px] text-slate-400">Click to focus</span>
              </div>

              {activeDoc.suspiciousRegions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                  No visual anomalies flagged on this document.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {activeDoc.suspiciousRegions.map((box) => {
                    const isSelected = box.id === selectedBoxId;
                    return (
                      <div
                        key={box.id}
                        id={`inspector-item-${box.id}`}
                        onClick={() => setSelectedBoxId(box.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500/50'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-200 truncate">{box.label}</span>
                          <span className="font-mono text-[10px] text-rose-300 font-bold">
                            {box.confidence}% conf
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{box.description}</p>
                        
                        {box.detectedValue && (
                          <div className="mt-1.5 text-[10px] font-mono bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-rose-300">
                            Detected: {box.detectedValue}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Decision Actions */}
          {activeDoc && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Examiner Decision
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-approve-document"
                  onClick={handleApprove}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Approve & Seal</span>
                </button>

                <button
                  id="btn-reject-document"
                  onClick={() => setRejectModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <XCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Reject (Fraud)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="btn-request-resubmission"
                  onClick={handleRequestResubmission}
                  className="px-2 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>Re-submission</span>
                </button>

                <button
                  id="btn-flag-suspicious"
                  onClick={handleFlagSuspicious}
                  className="px-2 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Flag Suspicious</span>
                </button>
              </div>
            </div>
          )}

          {/* Examiner Comments */}
          {activeDoc && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Audit Trail ({activeDoc.comments.length})
              </span>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 text-xs">
                {activeDoc.comments.map((comm) => (
                  <div key={comm.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-emerald-300">{comm.authorName}</span>
                      <span>{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{comm.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  id="comment-input-field"
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add examiner internal note..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition-colors flex items-center justify-center font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Reject Confirmation Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Document Rejection</h3>
                <p className="text-xs text-slate-400">This will record a formal document tampering event.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Reason for Rejection / Fraud Vector:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-fraud"
                type="button"
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Confirm Fraud & Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
