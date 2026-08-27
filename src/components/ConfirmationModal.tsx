import React from 'react';
import { VerificationStatus } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  documentTitle: string;
  documentId: string;
  decision: VerificationStatus;
  reviewerComments?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  documentTitle,
  documentId,
  decision,
  reviewerComments,
  isSubmitting = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const isApproval = decision === 'valid';
  const isRejection = decision === 'rejected';

  const modalTitle = isApproval 
    ? 'Approve this document?' 
    : isRejection 
    ? 'Reject this document?' 
    : 'Mark document as Suspicious?';

  const modalIcon = isApproval ? (
    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
      <CheckCircle2 className="w-6 h-6" />
    </div>
  ) : isRejection ? (
    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
      <XCircle className="w-6 h-6" />
    </div>
  ) : (
    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
      <AlertTriangle className="w-6 h-6" />
    </div>
  );

  const confirmBtnBg = isApproval
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30'
    : isRejection
    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40'
    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/30';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl shadow-cyan-950/50 space-y-5 text-center relative overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {modalIcon}

        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {modalTitle}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please confirm your administrative verification decision. This action will update the official authenticity status of the document.
          </p>
        </div>

        {/* Target Document Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
          <div className="flex justify-between items-start gap-2">
            <span className="text-slate-500 font-medium">Document:</span>
            <span className="font-bold text-slate-200 text-right truncate max-w-[220px]">
              {documentTitle}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Reference ID:</span>
            <span className="font-mono text-cyan-300">{documentId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Selected Decision:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
              isApproval 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isRejection
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {decision}
            </span>
          </div>

          {reviewerComments && reviewerComments.trim() && (
            <div className="pt-2 border-t border-slate-800 text-slate-300">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Reviewer Comment:</span>
              <p className="text-[11px] italic mt-0.5 text-slate-300 bg-slate-900/60 p-2 rounded-lg">
                "{reviewerComments}"
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`py-2.5 px-4 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${confirmBtnBg}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm</span>
            )}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
