import React, { useState } from 'react';
import { StudentDocument } from '../types';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Cpu, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Clock,
  Building2,
  Calendar,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';

interface VerificationResultModalProps {
  document: StudentDocument | null;
  onClose: () => void;
}

export const VerificationResultModal: React.FC<VerificationResultModalProps> = ({
  document,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'ocr' | 'structural' | 'forensics'>('summary');

  if (!document) return null;

  const {
    authenticityScore,
    riskLevel,
    status,
    ocrResult,
    structuralAnalysis,
    forensicAnalysis,
    explanation
  } = document;

  const isValid = status === 'valid';
  const isSuspicious = status === 'suspicious';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
              isValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10' :
              isSuspicious ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-500/10' :
              isRejected ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-blue-500/10'
            }`}>
              {isValid ? <ShieldCheck className="w-5 h-5" /> :
               isSuspicious ? <AlertTriangle className="w-5 h-5" /> :
               isRejected ? <XCircle className="w-5 h-5" /> :
               <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Document Authenticity & Verification Result
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  isValid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  isSuspicious ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  isRejected ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300">
                  {riskLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Document ID: <span className="font-mono text-slate-300">{document.id}</span> • {document.title}
              </p>
            </div>
          </div>

          <button
            id="btn-close-result-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Banner Hero */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Score Gauge & Document Overview */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    authenticityScore >= 80 ? 'text-emerald-400' :
                    authenticityScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }
                  strokeDasharray={`${authenticityScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-2xl font-black font-mono ${
                  authenticityScore >= 80 ? 'text-emerald-400' :
                  authenticityScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {authenticityScore}%
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verification Verdict
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {explanation.verdict.replace(/_/g, ' ')}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                <span className="flex items-center gap-1 text-slate-300">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <strong>{document.documentType}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{document.institution}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Seal Integrity</div>
              <div className="text-base font-black text-emerald-400 font-mono">
                {structuralAnalysis.sealIntegrityScore}%
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Font Kerning</div>
              <div className="text-base font-black text-cyan-400 font-mono">
                {forensicAnalysis.fontConsistencyScore}%
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-[10px] uppercase font-bold">ELA Anomaly</div>
              <div className={`text-base font-black font-mono ${
                forensicAnalysis.elaAnomalyScore > 50 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {forensicAnalysis.elaAnomalyScore}%
              </div>
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 bg-slate-950/90 border-b border-slate-800 overflow-x-auto text-xs font-bold">
          {[
            { id: 'summary', label: 'Verification Result', icon: Sparkles },
            { id: 'ocr', label: 'OCR & Field Extraction', icon: FileText },
            { id: 'structural', label: 'Structural Analysis', icon: Layers },
            { id: 'forensics', label: 'Forensic Analysis', icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`tab-result-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Summary & Verification Result */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-inner">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-400" />
                  Verification Summary
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {explanation.executiveSummary}
                </p>
                <div className="text-xs text-emerald-300 font-bold pt-2 border-t border-slate-800/80">
                  Recommended Action: {explanation.actionRecommendation}
                </div>
              </div>

              {/* Signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explanation.keyFindings.map((finding, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      finding.type === 'positive' 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : finding.type === 'negative'
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="mt-0.5">
                      {finding.type === 'positive' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {finding.type === 'negative' && <XCircle className="w-5 h-5 text-rose-400" />}
                      {finding.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{finding.title}</div>
                      <div className="text-xs text-slate-300 mt-1 leading-relaxed">{finding.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* File Info */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">File Name</span>
                  <span className="text-slate-200 font-mono">{document.fileName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">File Size</span>
                  <span className="text-slate-200 font-mono">{document.fileSize}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Uploaded Date</span>
                  <span className="text-slate-200 font-mono">{new Date(document.uploadedAt).toLocaleString()}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OCR & Field Extraction */}
          {activeTab === 'ocr' && (
            <div className="space-y-6">
              
              {/* Structured Extracted Fields Table */}
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Extracted Metadata Entities & Field Confidence
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold">OCR & Field Extraction</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Field Name</th>
                        <th className="py-2.5 px-3">Extracted Value</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ocrResult.fields.map((field, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-300">{field.fieldName}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-100 font-bold">{field.extractedValue}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400">{field.confidence}%</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              field.status === 'valid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              field.status === 'warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {field.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw OCR Text */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Raw Extracted OCR Text
                </span>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {ocrResult.rawText}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 3: Structural Analysis */}
          {activeTab === 'structural' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Template & Layout Geometry
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Template Match Score:</span>
                      <span className="font-mono font-bold text-emerald-400">{structuralAnalysis.templateMatchScore}%</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Layout Consistency Index:</span>
                      <span className="font-mono font-bold text-cyan-400">{structuralAnalysis.layoutConsistency}%</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Margin & Alignment:</span>
                      <span className="font-mono font-bold text-slate-200 capitalize">{structuralAnalysis.marginAlignment}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Logo & Emblem Match:</span>
                      <span className="font-mono font-bold text-emerald-400">{structuralAnalysis.logoVectorMatchScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Security Markers & Seals
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Official Seal Presence:</span>
                      <span className="font-bold text-slate-200">{structuralAnalysis.sealPresence ? 'Detected' : 'Missing'}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Seal Integrity Score:</span>
                      <span className="font-mono font-bold text-emerald-400">{structuralAnalysis.sealIntegrityScore}%</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Watermark Security:</span>
                      <span className="font-bold text-slate-200">{structuralAnalysis.watermarkDetected ? 'Detected' : 'Not Detected'}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">QR Code:</span>
                      <span className="font-mono text-emerald-400">{structuralAnalysis.qrCodeDecoded ? 'Decoded & Valid' : 'No QR Found'}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-slate-200 block mb-1">Structural Analysis Summary:</span>
                {structuralAnalysis.structuralSummary}
              </div>
            </div>
          )}

          {/* TAB 4: Forensic Analysis */}
          {activeTab === 'forensics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Pixel & Compression Forensics
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Error Level Analysis (ELA) Divergence:</span>
                      <span className={`font-mono font-bold ${
                        forensicAnalysis.elaAnomalyScore > 50 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {forensicAnalysis.elaAnomalyScore}% {forensicAnalysis.elaAnomalyScore > 50 ? '(Tamper Spike)' : '(Consistent)'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Copy-Move / Cloning Artifacts:</span>
                      <span className={`font-bold ${forensicAnalysis.copyMoveArtifactsDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {forensicAnalysis.copyMoveArtifactsDetected ? 'Detected' : 'None Detected'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Font Kerning Consistency:</span>
                      <span className="font-mono font-bold text-cyan-400">{forensicAnalysis.fontConsistencyScore}%</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Color Space Gradient Discrepancy:</span>
                      <span className="font-bold text-slate-200">{forensicAnalysis.colorSpaceDiscrepancy ? 'Discrepancy Found' : 'Uniform Color Space'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    File Metadata Audit
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Producer / Software:</span>
                      <span className="text-slate-200 font-mono text-[11px]">{forensicAnalysis.metadataAudit.producerSoftware}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">Modification Timestamp:</span>
                      <span className="text-slate-200 font-mono text-[11px]">{new Date(forensicAnalysis.metadataAudit.modificationDate).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Metadata Alteration:</span>
                      <span className={`font-bold ${forensicAnalysis.metadataAudit.metadataAltered ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {forensicAnalysis.metadataAudit.metadataAltered ? 'Altered' : 'Original'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-slate-200 block mb-1">Forensic Analysis Summary:</span>
                {forensicAnalysis.forensicSummary}
              </div>
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
};
