import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StudentDocument, VerificationStatus } from '../types';
import { 
  getReviewDocument, 
  submitReview 
} from '../services/adminDocumentService';
import { useAuth } from '../context/AuthContext';
import { AdminNavbar } from '../components/AdminNavbar';
import { DocumentViewer } from '../components/DocumentViewer';
import { FlaggedRegionPanel } from '../components/FlaggedRegionPanel';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Building, 
  User, 
  Calendar, 
  Cpu, 
  Scan, 
  Fingerprint, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  Loader2,
  Sparkles,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [document, setDocument] = useState<StudentDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Bounding Box for highlighting in DocumentViewer
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  // Admin Decision State
  const [selectedDecision, setSelectedDecision] = useState<VerificationStatus>('valid');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<VerificationStatus>('valid');

  // Success Notification Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load document on mount or ID change
  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;
    const fetchDoc = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getReviewDocument(id);
        if (isMounted) {
          if (!data) {
            setErrorMessage(`Document with ID "${id}" was not found in the verification registry.`);
          } else {
            setDocument(data);
            setSelectedDecision(data.status);
            // Default comment based on status
            if (data.status === 'suspicious') {
              setComments('Seal region appears inconsistent with the expected document format. Manual verification required.');
            } else if (data.status === 'rejected') {
              setComments(data.rejectionReason || 'Document rejected due to forensic inconsistencies.');
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load document for review.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDoc();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Open confirmation modal for specific decision
  const handleInitiateDecision = (decision: VerificationStatus) => {
    setPendingAction(decision);
    setSelectedDecision(decision);
    setShowConfirmModal(true);
  };

  // Confirm and execute decision submission
  const handleConfirmDecision = async () => {
    if (!document) return;

    setIsSubmitting(true);
    try {
      const reviewerName = user?.name ? `${user.name} (Admin)` : 'Institutional Administrator';
      const updatedDoc = await submitReview(
        document.id,
        pendingAction,
        comments,
        reviewerName
      );

      setDocument(updatedDoc);
      setShowConfirmModal(false);

      const toastMessage = pendingAction === 'valid'
        ? 'Document approved successfully.'
        : pendingAction === 'rejected'
        ? 'Document rejected successfully.'
        : 'Document marked as suspicious successfully.';

      setSuccessToast(toastMessage);

      // Clear toast after 5 seconds
      setTimeout(() => {
        setSuccessToast(null);
      }, 5000);

    } catch (err: any) {
      console.error('Failed to submit review decision:', err);
      alert(`Error submitting review: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Valid</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Suspicious</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  // Determine Layer status indicator
  const getLayerBadge = (score: number, status?: string) => {
    if (status === 'invalid' || score < 60) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Failed
        </span>
      );
    }
    if (status === 'warning' || score < 85) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Warning
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        Passed
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Background Animated Glow Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '11s' }} />
      </div>

      {/* Admin Navbar */}
      <AdminNavbar showBackToDashboard />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
        
        {/* Success Toast Notification */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-sm flex items-center justify-between gap-3 shadow-2xl shadow-emerald-950/50"
            >
              <div className="flex items-center gap-2.5 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{successToast}</span>
              </div>
              <Link
                to="/admin/dashboard"
                className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
              >
                Return to Queue
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Link & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/dashboard"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Back to Verification Queue"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Document Review
                </h1>
                {document && getStatusBadge(document.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect forensic anomalies, verify OCR extractions, and record administrative decisions.
              </p>
            </div>
          </div>

          {document && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                REF: {document.id}
              </span>
            </div>
          )}
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="py-32 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Loading document review data...</p>
          </div>
        ) : errorMessage || !document ? (
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-500/30 text-center space-y-4 max-w-lg mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Document Not Found</h3>
              <p className="text-xs text-slate-400">{errorMessage || 'Unable to retrieve document details.'}</p>
            </div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Verification Queue</span>
            </Link>
          </div>
        ) : (
          /* Main Two/Three-Column Review Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ============================================================== */}
            {/* LEFT / MAIN COLUMN (7 cols on lg): Document Viewer + Flagged Areas */}
            {/* ============================================================== */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Document Preview Viewer */}
              <DocumentViewer
                document={document}
                selectedBoxId={selectedBoxId}
                onSelectBox={setSelectedBoxId}
              />

              {/* Flagged Regions Panel */}
              <FlaggedRegionPanel
                regions={document.suspiciousRegions || []}
                selectedBoxId={selectedBoxId}
                onSelectBox={setSelectedBoxId}
              />

            </div>

            {/* ============================================================== */}
            {/* RIGHT COLUMN (5 cols on lg): Details, Breakdown, Decision, Audit */}
            {/* ============================================================== */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* 1. Document Information Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Document Information</h3>
                    <p className="text-[11px] text-slate-400">Submission metadata & student details</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 font-medium">Document Name:</span>
                    <span className="font-bold text-slate-100 text-right truncate max-w-[200px]">
                      {document.title}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Document ID:</span>
                    <span className="font-mono text-cyan-300 font-bold">{document.id}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Document Type:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-semibold">
                      {document.documentType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Student Name:</span>
                    <span className="font-bold text-slate-200">{document.studentName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Student ID:</span>
                    <span className="font-mono text-slate-300">{document.studentId}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Upload Date:</span>
                    <span className="text-slate-300">
                      {new Date(document.uploadedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 font-medium">Institution:</span>
                    <span className="font-medium text-slate-200 text-right truncate max-w-[190px]">
                      {document.institution}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 font-medium">Current Status:</span>
                    {getStatusBadge(document.status)}
                  </div>
                </div>
              </div>

              {/* 2. Large Authenticity Score Card */}
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">Authenticity Score</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Automated Evaluation</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-baseline gap-1">
                      <span>{document.authenticityScore}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        document.status === 'valid'
                          ? 'text-emerald-400'
                          : document.status === 'suspicious'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {document.status}
                      </span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-xs font-bold text-slate-400">{document.riskLevel}</span>
                    </div>
                  </div>

                  {/* Visual Radial Gauge Indicator */}
                  <div className="relative w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border-4 border-slate-800">
                    <span className={`text-sm font-black font-mono ${
                      document.authenticityScore >= 85 ? 'text-emerald-400' : document.authenticityScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {document.authenticityScore}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "{document.explanation.executiveSummary}"
                </p>
              </div>

              {/* 3. AI Verification Summary (3 Major Layers) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">AI Verification Summary</h3>
                    <p className="text-[11px] text-slate-400">Three-layer authenticity breakdown</p>
                  </div>
                </div>

                <div className="space-y-3">
                  
                  {/* Layer 1: OCR & Field Extraction */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <Scan className="w-3.5 h-3.5 text-cyan-400" />
                        <span>OCR & Field Extraction</span>
                      </div>
                      {getLayerBadge(
                        document.ocrResult.fields.every(f => f.status === 'valid') ? 95 : 60,
                        document.ocrResult.fields.some(f => f.status === 'invalid') ? 'invalid' : document.ocrResult.fields.some(f => f.status === 'warning') ? 'warning' : 'valid'
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Required fields were successfully extracted and validated against academic taxonomy schemas.
                    </p>
                  </div>

                  {/* Layer 2: Structural Analysis */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <Building className="w-3.5 h-3.5 text-teal-400" />
                        <span>Structural Analysis</span>
                      </div>
                      {getLayerBadge(document.structuralAnalysis.templateMatchScore)}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Document structure, institutional vector emblems, and expected margins were analyzed.
                    </p>
                  </div>

                  {/* Layer 3: Forensic Analysis */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Forensic Analysis</span>
                      </div>
                      {getLayerBadge(100 - document.forensicAnalysis.elaAnomalyScore)}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Image compression forensics, font kerning checks, and file metadata audits were completed.
                    </p>
                  </div>

                </div>
              </div>

              {/* 4. Admin Decision Panel */}
              {document.status === 'valid' || document.status === 'rejected' ? (
                /* COMPLETED DECISION PANEL (Read-only) */
                <div className={`bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden ${
                  document.status === 'valid' ? 'border-emerald-500/30' : 'border-rose-500/30'
                }`}>
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
                    document.status === 'valid' ? 'via-emerald-400' : 'via-rose-400'
                  } to-transparent`} />

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${document.status === 'valid' ? 'text-emerald-400' : 'text-rose-400'}`} />
                      <h3 className="text-sm font-bold text-white tracking-tight">Verification Decision</h3>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border ${
                      document.status === 'valid'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                    }`}>
                      Decision Completed
                    </span>
                  </div>

                  {/* Read-only Decision Summary */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Decision:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        document.status === 'valid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {document.status === 'valid' ? 'VALID' : 'REJECTED'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Reviewed By:</span>
                      <span className="font-semibold text-slate-200">
                        {document.reviewedBy || user?.name || 'Administrator'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Review Date:</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {document.reviewedAt
                          ? new Date(document.reviewedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'Recorded'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-slate-400 font-medium block">Reviewer Comments:</span>
                      <p className="p-2.5 bg-slate-900/80 rounded-xl text-xs text-slate-200 italic border border-slate-800">
                        "{document.rejectionReason || document.comments?.[0]?.text || (document.status === 'valid' ? 'Document verified as authentic. No tampering detected.' : 'Document failed verification checks.')}"
                      </p>
                    </div>
                  </div>
                </div>
              ) : document.status === 'suspicious' ? (
                /* SUSPICIOUS DECISION PANEL (Manual Review Required) */
                <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white tracking-tight">Verification Decision</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/30">
                      Manual Review Required
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automated verification detected possible inconsistencies. Inspect the flagged regions and verification results, then record the final decision.
                  </p>

                  {/* Decision Choices: Valid or Rejected */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Select Final Decision:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDecision('valid')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedDecision === 'valid'
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Appears authentic</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedDecision('rejected')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedDecision === 'rejected'
                            ? 'bg-rose-950/60 border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Invalid credential</p>
                      </button>
                    </div>
                  </div>

                  {/* Reviewer Comments */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Reviewer Comments</span>
                      <span className="text-[10px] text-slate-500 font-normal">Required for manual review</span>
                    </label>
                    <textarea
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter your review comments..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Approve / Reject Controls */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      id="btn-admin-approve"
                      type="button"
                      onClick={() => handleInitiateDecision('valid')}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Approve</span>
                    </button>

                    <button
                      id="btn-admin-reject"
                      type="button"
                      onClick={() => handleInitiateDecision('rejected')}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* PENDING DECISION PANEL (Action Required) */
                <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white tracking-tight">Verification Decision</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      Action Required
                    </span>
                  </div>

                  {/* Selectable Decision Cards */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 block">Select Decision:</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      
                      {/* Valid Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedDecision('valid')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedDecision === 'valid'
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Appears authentic</p>
                      </button>

                      {/* Suspicious Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedDecision('suspicious')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedDecision === 'suspicious'
                            ? 'bg-amber-950/60 border-amber-500 text-white shadow-md shadow-amber-950/40 ring-1 ring-amber-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Suspicious</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Manual review</p>
                      </button>

                      {/* Rejected Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedDecision('rejected')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedDecision === 'rejected'
                            ? 'bg-rose-950/60 border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Invalid credential</p>
                      </button>

                    </div>
                  </div>

                  {/* Reviewer Comments */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Reviewer Comments</span>
                      <span className="text-[10px] text-slate-500 font-normal">Optional justification</span>
                    </label>
                    <textarea
                      rows={3}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter your review comments..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Approve / Reject Controls */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      id="btn-admin-approve"
                      type="button"
                      onClick={() => handleInitiateDecision('valid')}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Approve</span>
                    </button>

                    <button
                      id="btn-admin-reject"
                      type="button"
                      onClick={() => handleInitiateDecision('rejected')}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>

                  {selectedDecision === 'suspicious' && (
                    <button
                      type="button"
                      onClick={() => handleInitiateDecision('suspicious')}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Save as Suspicious (Manual Inspection)</span>
                    </button>
                  )}

                </div>
              )}

              {/* 5. Audit Information */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-bold border-b border-slate-800 pb-2">
                  <History className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Audit Information</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Reviewed By:</span>
                    <span className="font-semibold text-slate-200">
                      {document.reviewedBy || 'Pending Administrator Review'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Review Date / Time:</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {document.reviewedAt 
                        ? new Date(document.reviewedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'Not yet recorded'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Decision:</span>
                    <span className="font-bold text-cyan-300 uppercase">{document.status}</span>
                  </div>
                  {document.comments && document.comments.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Latest Reviewer Comment:</span>
                      <p className="p-2 bg-slate-950 rounded-xl text-[11px] text-slate-300 italic">
                        "{document.comments[0].text}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Confirmation Dialog Modal */}
      {document && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          documentTitle={document.title}
          documentId={document.id}
          decision={pendingAction}
          reviewerComments={comments}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmDecision}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-slate-500 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span>VeriDoc AI • Institutional Admin Verification Console</span>
          <span>Security & Audit Logs Protected</span>
        </div>
      </footer>

    </div>
  );
};
