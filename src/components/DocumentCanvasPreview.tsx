import React, { useState, useRef } from 'react';
import { StudentDocument, BoundingBox, AnomalySeverity } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  Layers, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Info,
  Scan,
  Grid,
  Sparkles,
  Plus
} from 'lucide-react';

interface DocumentCanvasPreviewProps {
  document: StudentDocument;
  activeLayers: {
    scan: boolean;
    anomalies: boolean;
    ocr: boolean;
    ela: boolean;
    grid: boolean;
  };
  selectedBoxId: string | null;
  onSelectBox: (boxId: string | null) => void;
  onAddAnnotation?: (box: Omit<BoundingBox, 'id'>) => void;
  isAnnotationMode?: boolean;
}

export const DocumentCanvasPreview: React.FC<DocumentCanvasPreviewProps> = ({
  document,
  activeLayers,
  selectedBoxId,
  onSelectBox,
  onAddAnnotation,
  isAnnotationMode = false
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotationMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentDraw({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setCurrentDraw({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDraw && currentDraw.width > 2 && currentDraw.height > 2 && onAddAnnotation) {
      onAddAnnotation({
        x: Math.round(currentDraw.x),
        y: Math.round(currentDraw.y),
        width: Math.round(currentDraw.width),
        height: Math.round(currentDraw.height),
        label: 'Verifier Custom Tag',
        severity: 'high',
        category: 'font_mismatch',
        description: 'Manually flagged suspicious region by examiner.',
        confidence: 88
      });
    }
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
  };

  const getSeverityBadgeColor = (severity: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-500 bg-rose-500/15 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
      case 'high':
        return 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/15 text-yellow-300';
      case 'info':
        return 'border-emerald-500 bg-emerald-500/15 text-emerald-300';
      default:
        return 'border-blue-500 bg-blue-500/15 text-blue-300';
    }
  };

  const isTamperedMIT = document.id === 'DOC-2026-7732';
  const isMIT = isTamperedMIT || document.institution.toLowerCase().includes('massachusetts') || document.institution.toLowerCase().includes('mit');
  const isOxford = document.id === 'DOC-2026-6109' || document.institution.toLowerCase().includes('oxford');
  const isHarvard = document.id === 'DOC-2026-5520' || document.institution.toLowerCase().includes('harvard');
  const isStanford = document.id === 'DOC-2026-8941' || document.institution.toLowerCase().includes('stanford');
  const isUofT = document.id === 'DOC-2026-3392' || document.institution.toLowerCase().includes('toronto');

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden select-none">
      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5 text-indigo-400" />
            Forensic Viewport
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 truncate max-w-[200px]">{document.fileName}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
            {document.fileSize}
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 min-w-[45px] text-center border border-slate-800">
            {zoom}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="btn-rotate"
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            id="btn-reset-view"
            onClick={handleResetZoom}
            title="Reset View"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div 
        className="relative flex-1 overflow-auto bg-slate-950 p-6 flex items-center justify-center cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          ref={canvasRef}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: isDrawing ? 'none' : 'transform 0.15s ease-out'
          }}
          className={`relative w-[620px] min-h-[840px] bg-amber-50/95 text-slate-900 rounded-sm shadow-2xl border-4 border-amber-200/80 p-8 flex flex-col justify-between select-none overflow-hidden transition-all ${
            activeLayers.ela ? 'filter-ela-mode' : ''
          }`}
        >
          {/* ELA Simulated Thermal Noise Overlay */}
          {activeLayers.ela && (
            <div className="absolute inset-0 bg-slate-950/90 mix-blend-hard-light pointer-events-none z-30 flex flex-col justify-between p-6">
              <div className="text-[11px] font-mono text-cyan-400 bg-slate-900/80 px-3 py-1.5 rounded border border-cyan-500/30 flex items-center justify-between">
                <span>[ELA DIGITAL NOISE MAP - 95% COMPRESSION DELTA]</span>
                <span className="text-rose-400 font-bold">
                  {document.forensicAnalysis.elaAnomalyScore > 50 ? 'TAMPER SPIKE DETECTED' : 'NORMAL GRADIENT'}
                </span>
              </div>
              <div className="space-y-4 my-auto">
                {document.suspiciousRegions.map((box, idx) => (
                  <div 
                    key={`ela-${box.id || idx}`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      position: 'absolute'
                    }}
                    className="bg-rose-500/40 border-2 border-rose-400 rounded animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.8)]"
                  />
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-400 text-right">
                Pixel Compression Anomaly Index: {document.forensicAnalysis.elaAnomalyScore}%
              </div>
            </div>
          )}

          {/* Grid Overlay */}
          {activeLayers.grid && (
            <div className="absolute inset-0 pointer-events-none z-20 opacity-30 bg-[linear-gradient(to_right,#0284c7_1px,transparent_1px),linear-gradient(to_bottom,#0284c7_1px,transparent_1px)] bg-[size:24px_24px]" />
          )}

          {/* Document Content Simulation (High Fidelity Academic Layout) */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Top Header & Crest */}
            <div className="text-center pb-4 border-b-2 border-amber-900/30">
              <div className="flex justify-center items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full border-2 border-amber-800 flex items-center justify-center bg-amber-100 font-serif text-amber-900 font-bold text-lg shadow-inner">
                  {isStanford ? 'ST' : isMIT ? 'MIT' : isOxford ? 'OX' : isHarvard ? 'VERI' : 'ACAD'}
                </div>
                <div>
                  <h1 className="font-serif font-black tracking-wider text-xl uppercase text-amber-950">
                    {document.institution}
                  </h1>
                  <p className="font-serif italic text-xs text-amber-800">
                    {isStanford && 'Office of the University Registrar • Official Record'}
                    {isMIT && 'Office of Faculty Governance & Academic Degrees'}
                    {isOxford && 'Given at Oxford by Decree of Convocation'}
                    {isHarvard && 'Faculty of Arts & Sciences • Academic Transcript'}
                    {isUofT && 'University of Toronto • Directorate of Student Records'}
                    {!isStanford && !isMIT && !isOxford && !isHarvard && !isUofT && 'Office of Academic Affairs & Records'}
                  </p>
                </div>
              </div>

              <div className="mt-3 inline-block px-4 py-1 bg-amber-900/10 rounded-full border border-amber-900/20 font-serif uppercase tracking-widest text-[11px] font-bold text-amber-900">
                {document.documentType}
              </div>
            </div>

            {/* Document Body Details */}
            <div className="my-6 space-y-5 text-slate-800">
              <div className="text-center">
                <p className="font-serif text-xs italic text-amber-900">This official instrument certifies that</p>
                
                {/* Student Recipient Name (with visual highlight if tampered) */}
                <div className={`my-2 py-1 px-4 inline-block font-serif text-2xl font-bold tracking-wide ${
                  isTamperedMIT ? 'bg-rose-100/80 text-rose-900 border border-dashed border-rose-400 rounded' : 'text-amber-950'
                }`}>
                  {document.studentName}
                </div>

                <p className="font-serif text-xs text-slate-600">
                  Student Identification: <span className="font-mono font-semibold text-slate-800">{document.studentId}</span>
                </p>
              </div>

              <div className="p-4 bg-amber-100/60 rounded border border-amber-800/20 text-xs font-serif leading-relaxed text-center">
                {isStanford && (
                  <p>
                    has satisfactorily completed the prescribed curriculum in <strong className="font-bold text-slate-950">Computer Science</strong> and has maintained a cumulative grade point average of <strong className="font-mono text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded">3.94 / 4.00</strong> with all institutional honors.
                  </p>
                )}
                {isMIT && (
                  <p>
                    having met all requirements is conferred the Degree of <strong className="font-bold text-slate-950">Bachelor of Science in Artificial Intelligence</strong> with honors classification of <strong className="font-mono text-rose-800 bg-rose-100/80 px-1.5 py-0.5 rounded border border-rose-300">SUMMA CUM LAUDE</strong>.
                  </p>
                )}
                {isOxford && (
                  <p>
                    has been admitted to the Degree of <strong className="font-bold text-slate-950">Master of Science in Mathematical Modelling</strong> with Highest Distinction in examination.
                  </p>
                )}
                {isHarvard && (
                  <div className="space-y-1.5 text-left font-mono text-[11px] bg-amber-50 p-2.5 rounded border border-amber-300">
                    <div className="flex justify-between font-bold border-b border-amber-200 pb-1">
                      <span>Course Module</span>
                      <span>Credits</span>
                      <span>Grade</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CS181 Machine Learning</span>
                      <span>4.0</span>
                      <span className="text-amber-700 font-bold bg-amber-100 px-1 rounded">A (Flagged)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STAT110 Probability</span>
                      <span>4.0</span>
                      <span>A</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CS124 Algorithms</span>
                      <span>4.0</span>
                      <span>A</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-amber-200">
                      <span>Cumulative GPA</span>
                      <span>12.0</span>
                      <span className="text-amber-800">4.00</span>
                    </div>
                  </div>
                )}
                {!isStanford && !isMIT && !isOxford && !isHarvard && (
                  <p>
                    has fulfilled all conditions and academic milestones requisite for graduation and is recognized by the Governing Faculty.
                  </p>
                )}
              </div>
            </div>

            {/* Document Bottom Signatures & Seal */}
            <div className="pt-4 border-t-2 border-amber-900/30 flex items-end justify-between text-[11px] font-serif">
              <div className="text-center w-36">
                <div className="h-9 flex items-center justify-center font-cursive italic text-slate-700 text-lg border-b border-slate-400">
                  {isStanford ? 'E. Vance' : isMIT ? 'S. Kornbluth' : isOxford ? 'I. Tracey' : 'Registrar'}
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Authorized University Registrar</p>
              </div>

              {/* Official Seal / Wax Impression */}
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-center p-2 font-serif text-[9px] uppercase font-bold border-2 ${
                isTamperedMIT 
                  ? 'border-rose-400 bg-rose-50 text-rose-900 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                  : 'border-amber-700 bg-amber-200/80 text-amber-900 shadow-md'
              }`}>
                <div className="border border-dashed border-amber-800/40 w-full h-full rounded-full flex flex-col items-center justify-center">
                  <span>OFFICIAL</span>
                  <span className="text-[8px] font-mono">SEAL</span>
                  <span>RECORD</span>
                </div>
              </div>

              <div className="text-center w-36">
                <div className="h-9 flex items-center justify-center font-mono text-[10px] text-slate-700 border-b border-slate-400">
                  {new Date(document.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Conferral & Attestation Date</p>
              </div>
            </div>

            {/* Microprint security border & hash */}
            <div className="mt-4 pt-2 border-t border-slate-300/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span className="truncate max-w-[280px]">
                SHA-256: {document.forensicAnalysis.metadataAudit.fileHashSha256.slice(0, 24)}...
              </span>
              <span>VERIDOC SECURE ID: {document.id}</span>
            </div>
          </div>

          {/* Interactive Bounding Box Overlay for Suspicious / Verified Regions */}
          {activeLayers.anomalies && document.suspiciousRegions.map((box) => {
            const isSelected = selectedBoxId === box.id;
            return (
              <div
                key={box.id}
                id={`box-${box.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBox(box.id);
                }}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                }}
                className={`absolute z-40 border-2 rounded transition-all cursor-pointer group ${getSeverityBadgeColor(
                  box.severity
                )} ${isSelected ? 'ring-4 ring-cyan-400 ring-offset-1 scale-[1.01]' : 'hover:scale-[1.01]'}`}
              >
                {/* Floating Tag */}
                <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-tight flex items-center gap-1 shadow-md bg-slate-900 text-white border border-slate-700 whitespace-nowrap">
                  {box.severity === 'critical' && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                  {box.severity === 'high' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  {box.severity === 'info' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                  <span>{box.label}</span>
                  <span className="text-slate-400 text-[9px]">({box.confidence}%)</span>
                </div>
              </div>
            );
          })}

          {/* OCR Extracted Text Bounding Boxes */}
          {activeLayers.ocr && document.ocrResult.fields.map((field, idx) => (
            <div
              key={`ocr-field-${idx}`}
              style={{
                left: `${15 + (idx % 2) * 35}%`,
                top: `${20 + idx * 8}%`,
                width: '32%',
                height: '5%'
              }}
              className="absolute z-35 border border-cyan-400/80 bg-cyan-400/10 rounded flex items-center px-2 text-[9px] font-mono text-cyan-900 pointer-events-none"
            >
              <span className="truncate">OCR: {field.fieldName} ({field.confidence}%)</span>
            </div>
          ))}

          {/* Current Drag Annotation Preview */}
          {isDrawing && currentDraw && (
            <div
              style={{
                left: `${currentDraw.x}%`,
                top: `${currentDraw.y}%`,
                width: `${currentDraw.width}%`,
                height: `${currentDraw.height}%`,
              }}
              className="absolute z-50 border-2 border-dashed border-indigo-500 bg-indigo-500/20 rounded pointer-events-none animate-pulse flex items-center justify-center text-[10px] font-mono text-indigo-200"
            >
              Draw Region
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status bar for Canvas */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              document.status === 'verified' ? 'bg-emerald-400' :
              document.status === 'flagged' ? 'bg-amber-400' :
              document.status === 'rejected' ? 'bg-rose-500' : 'bg-blue-400'
            }`} />
            Status: <strong className="text-slate-200 capitalize">{document.status}</strong>
          </span>
          <span>•</span>
          <span>Authenticity Score: <strong className={document.authenticityScore >= 80 ? 'text-emerald-400' : document.authenticityScore >= 50 ? 'text-amber-400' : 'text-rose-400'}>{document.authenticityScore}%</strong></span>
          <span>•</span>
          <span>Anomalies Flagged: <strong className="text-slate-200">{document.suspiciousRegions.length}</strong></span>
        </div>

        {isAnnotationMode && (
          <div className="text-indigo-400 font-medium flex items-center gap-1 animate-pulse">
            <Plus className="w-3.5 h-3.5" />
            Click & drag on document to flag custom anomaly region
          </div>
        )}
      </div>
    </div>
  );
};
