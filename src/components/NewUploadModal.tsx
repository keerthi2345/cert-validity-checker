import React, { useState, useEffect } from 'react';
import { DocumentType, StudentDocument } from '../types';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Zap,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { documentService } from '../services/documentService';
import { mapVerificationDetail } from '../services/adapters';


interface NewUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newDoc: StudentDocument) => void;
}

export const NewUploadModal: React.FC<NewUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
    const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType>('12th Marksheet');
  const [institution, setInstitution] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  // Upload & processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [completedDoc, setCompletedDoc] = useState<StudentDocument | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize(`${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setTitle(baseName);
    }
  };

  const stages = [
    { title: 'Ingestion & Validation', desc: 'Validating file format, size, and generating integrity signature' },
    { title: 'OCR & Field Extraction', desc: 'Extracting key-value text pairs, candidate details, and subject marks' },
    { title: 'Structural Analysis', desc: 'Checking template consistency, seal presence, and layout geometry' },
    { title: 'Forensic Analysis', desc: 'Analyzing pixel compression, font kerning, and metadata integrity' },
    { title: 'Authenticity Verification', desc: 'Computing authenticity score and compiling verification result' }
  ];

    const handleStartUploadAndVerify = async () => {
    if (!file) {
      setUploadError('Please select a file first.');
      return;
    }

    setUploadError('');
    setIsProcessing(true);
    setProgressPercent(15);
    setProcessingStage(0);

    try {
      // Real upload to Person 2's backend
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await documentService.uploadDocument(formData);

      setProgressPercent(35);
      setProcessingStage(1);

      const documentId = (uploaded as any).document_id;

      // Real backend processing is asynchronous (Celery) — poll until it's done,
      // rather than pretending it finished instantly.
      let finalDoc: any = null;
      const maxAttempts = 30; // up to ~60s
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));

        if (attempt === 2) setProcessingStage(2);
        if (attempt === 5) setProcessingStage(3);
        setProgressPercent(Math.min(90, 35 + attempt * 3));

        const detail = await documentService.getDocumentById(documentId);
        if (detail && (detail as any).final_status && (detail as any).final_status !== null) {
          finalDoc = detail;
          break;
        }
      }

      setProgressPercent(100);
      setProcessingStage(4);

      if (!finalDoc) {
        throw new Error('Verification is taking longer than expected. Check your document history shortly.');
      }

      const mappedDoc = mapVerificationDetail(finalDoc);
      setCompletedDoc(mappedDoc);
      setIsProcessing(false);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setIsProcessing(false);
      setUploadError(err.message || 'Upload failed. Please try again.');
    }
  };

  const handleFinishAndOpenReport = () => {
    if (completedDoc) {
      onUploadSuccess(completedDoc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Upload Academic Document
              </h2>
              <p className="text-xs text-slate-400">
                Automated OCR, Structural Validation & Forensic Verification
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              id="btn-close-upload-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Step 1: Form Inputs & File Drop if not processing */}
          {!isProcessing && !completedDoc && (
            <>
              {/* File Drop Container */}
              <label 
                htmlFor="file-upload-input"
                className="border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all group"
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  {file ? file.name : 'Click to select or drag document scan here'}
                </div>
                <p className="text-xs text-slate-400">
                  Accepts PDF, JPG, PNG up to 25MB
                </p>
              </label>

              {/* Document Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Document Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-300">Document Title</label>
                  <input
                    id="input-doc-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Document Type Dropdown */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Document Type</label>
                  <select
                    id="select-doc-type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="10th Marksheet">10th Marksheet</option>
                    <option value="12th Marksheet">12th Marksheet</option>
                    <option value="Degree Certificate">Degree Certificate</option>
                    <option value="Migration Certificate">Migration Certificate</option>
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Bonafide Certificate">Bonafide Certificate</option>
                    <option value="Provisional Certificate">Provisional Certificate</option>
                    <option value="Academic Transcript">Academic Transcript</option>
                  </select>
                </div>

                {/* Issuing Institution */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Issuing Institution</label>
                  <input
                    id="input-institution"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Central Board of Secondary Education"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Candidate Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Candidate / Student Name</label>
                  <input
                    id="input-student-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Candidate / Roll No */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Roll No / Student ID</label>
                  <input
                    id="input-student-id"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              {uploadError && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/30 rounded-xl px-3 py-2">
                  {uploadError}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="btn-start-verification"
                  onClick={handleStartUploadAndVerify}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Zap className="w-4 h-4 stroke-[2.5]" />
                  <span>Start Verification</span>
                </button>
              </div>
            </>
          )}

          {/* Step 2: Processing Live Stages & Progress */}
          {isProcessing && (
            <div className="py-6 space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-pulse">
                  <Cpu className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-white">
                  Executing Verification Pipeline
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Running OCR extraction, template matching, and pixel forensics...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Pipeline Execution</span>
                  <span className="text-emerald-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_12px_#34d399]"
                  />
                </div>
              </div>

              {/* Pipeline Stages checklist */}
              <div className="space-y-2 pt-2">
                {stages.map((stage, idx) => {
                  const isDone = processingStage > idx;
                  const isCurrent = processingStage === idx;
                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isDone ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
                        isCurrent ? 'bg-slate-800 border-emerald-500/40 text-white' :
                        'bg-slate-950/40 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone ? 'bg-emerald-500 text-slate-950' :
                          isCurrent ? 'bg-cyan-500 text-slate-950 animate-ping' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{stage.title}</div>
                          <div className="text-[10px] text-slate-400">{stage.desc}</div>
                        </div>
                      </div>

                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* Step 3: Success Screen */}
          {completedDoc && !isProcessing && (
            <div className="py-4 space-y-6 text-center">
              
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  Verification Complete
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Document has been processed and saved to your history.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Document:</span>
                  <span className="font-bold text-white">{completedDoc.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">{completedDoc.status}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Authenticity Score:</span>
                  <span className="font-mono font-bold text-emerald-400">{completedDoc.authenticityScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verdict:</span>
                  <span className="font-bold text-slate-200">{completedDoc.explanation.verdict.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-view-results"
                  onClick={handleFinishAndOpenReport}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>View Verification Result</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
};
