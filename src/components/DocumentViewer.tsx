import React, { useState } from 'react';
import { BoundingBox, StudentDocument } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DocumentViewerProps {
  document: StudentDocument;
  selectedBoxId?: string | null;
  onSelectBox?: (boxId: string | null) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  selectedBoxId,
  onSelectBox
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 1;
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoomLevel(100);

  const boxes = document.suspiciousRegions || [];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Viewer Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Document Preview</span>
              {boxes.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  {boxes.length} Flagged {boxes.length === 1 ? 'Region' : 'Regions'}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-sm">
              {document.fileName} • {document.fileSize}
            </p>
          </div>
        </div>

        {/* Zoom & Overlay Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Flagged Regions Overlay */}
          {boxes.length > 0 && (
            <button
              id="btn-toggle-overlays"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showOverlays 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle forensic bounding box overlay"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{showOverlays ? 'Hide Boxes' : 'Show Boxes'}</span>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs text-slate-300">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 75}
              className="p-1.5 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-cyan-300 min-w-[45px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              className="p-1.5 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border-l border-slate-800 ml-0.5"
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Page Navigation */}
          <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-[11px] text-slate-400">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="px-1.5 font-mono text-slate-300">
              {currentPage}/{totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas / Viewport Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/60 min-h-[480px]">
        
        <motion.div
          animate={{ scale: zoomLevel / 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative max-w-full bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none transition-shadow"
          style={{ width: '640px', minHeight: '820px' }}
        >
          {/* Simulated Authentic Indian Academic Document Layout */}
          <div className="p-8 bg-[#0d1322] text-slate-200 min-h-[820px] flex flex-col justify-between relative overflow-hidden font-serif border border-slate-800/80">
            
            {/* Subtle Guilloche / Security Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Outer Security Micro-Border */}
            <div className="absolute inset-3 border-2 border-dashed border-cyan-500/20 rounded-xl pointer-events-none" />

            {/* Document Header */}
            <div className="text-center space-y-2 relative z-10 border-b-2 border-slate-700/60 pb-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md">
                <Building className="w-7 h-7 text-cyan-400" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-100 uppercase font-sans">
                {document.institution}
              </h2>
              <p className="text-xs text-cyan-300 uppercase tracking-widest font-sans font-bold">
                {document.documentType}
              </p>
              <p className="text-[10px] text-slate-400 font-sans font-mono">
                DOCUMENT REFERENCE: {document.id} • ACADEMIC RECORD DIVISION
              </p>
            </div>

            {/* Document Body */}
            <div className="py-6 space-y-5 text-xs sm:text-sm leading-relaxed relative z-10 font-sans">
              
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Candidate Name:</span>
                  <span className="font-bold text-slate-100 tracking-wide">{document.studentName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Enrollment / Roll No:</span>
                  <span className="font-mono font-bold text-cyan-300">{document.studentId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Uploaded Date:</span>
                  <span className="text-slate-300">{new Date(document.uploadedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
                </div>
              </div>

              {/* Extracted Record Entities Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Extracted Record Details
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Field Entity</th>
                        <th className="py-2 px-3">Extracted Value</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
                      {document.ocrResult.fields.map((field, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-300 font-sans">{field.fieldName}</td>
                          <td className="py-2 px-3 font-semibold text-slate-100">{field.extractedValue}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              field.status === 'valid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : field.status === 'warning'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-400'
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

              {/* Document Summary Quote */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 text-[11px] text-slate-400 italic">
                "{document.structuralAnalysis.structuralSummary}"
              </div>

            </div>

            {/* Document Footer: Seals, Signatures, QR Code */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between relative z-10 text-[11px] font-sans">
              {/* Seal Stamp */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-teal-500/60 flex items-center justify-center p-1 text-center bg-teal-500/5">
                  <div className="text-[8px] font-bold uppercase text-teal-400 leading-tight">
                    OFFICIAL<br/>SEAL
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-300">Registrar Seal</p>
                  <p className="text-[10px] text-slate-500">Authenticated</p>
                </div>
              </div>

              {/* Controller Signature */}
              <div className="text-right space-y-0.5">
                <div className="font-serif italic text-sm text-cyan-300 font-semibold underline decoration-cyan-500/50">
                  {document.reviewedBy || 'Controller of Examinations'}
                </div>
                <p className="text-[10px] text-slate-400 font-sans uppercase">Authorized Signatory</p>
              </div>
            </div>

            {/* ============================================================== */}
            {/* OVERLAY: Flagged Region Bounding Boxes Rendered Over Document */}
            {/* ============================================================== */}
            <AnimatePresence>
              {showOverlays && boxes.map((box, index) => {
                const isSelected = selectedBoxId === box.id;
                const isCritical = box.severity === 'critical';
                const isHigh = box.severity === 'high';
                const isMedium = box.severity === 'medium';

                const borderColor = isCritical || isHigh 
                  ? 'border-rose-500' 
                  : isMedium 
                  ? 'border-amber-400' 
                  : 'border-cyan-400';

                const bgColor = isCritical || isHigh 
                  ? 'bg-rose-500/20' 
                  : isMedium 
                  ? 'bg-amber-500/20' 
                  : 'bg-cyan-500/15';

                const badgeBg = isCritical || isHigh
                  ? 'bg-rose-600 text-white'
                  : isMedium
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-cyan-500 text-slate-950 font-black';

                return (
                  <motion.div
                    key={box.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBox?.(isSelected ? null : box.id);
                    }}
                    className={`absolute cursor-pointer transition-all duration-200 z-30 border-2 ${borderColor} ${bgColor} rounded-md ${
                      isSelected 
                        ? 'ring-4 ring-rose-400/80 shadow-[0_0_25px_rgba(244,63,94,0.6)] scale-[1.01]' 
                        : 'hover:ring-2 hover:ring-rose-400/60 shadow-lg'
                    }`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  >
                    {/* Bounding Box Floating Label Badge */}
                    <div 
                      className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] tracking-tight uppercase whitespace-nowrap shadow-md flex items-center gap-1 ${badgeBg}`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{box.label || `Flagged Area #${index + 1}`}</span>
                    </div>

                    {/* Subtle Pulse Animation for Critical Anomalies */}
                    {isCritical && (
                      <div className="absolute inset-0 border border-rose-400 animate-ping rounded-md pointer-events-none opacity-40" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

          </div>
        </motion.div>

      </div>



    </div>
  );
};
