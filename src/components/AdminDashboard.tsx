import React, { useState } from 'react';
import { SystemStats, VerificationPolicy, StudentDocument, VerificationStatus } from '../types';
import { VerifierReviewQueue } from './VerifierReviewQueue';
import { 
  BarChart3, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Sliders, 
  Terminal, 
  Play, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Clock, 
  FileText,
  Activity,
  Code,
  SearchCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  stats: SystemStats;
  policies: VerificationPolicy;
  onUpdatePolicies: (updated: VerificationPolicy) => void;
  documents: StudentDocument[];
  onSelectDocument: (doc: StudentDocument) => void;
  onUpdateDocumentStatus: (
    docId: string, 
    status: VerificationStatus, 
    comment?: string,
    rejectionReason?: string
  ) => void;
  onOpenReportModal: (doc: StudentDocument) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  policies,
  onUpdatePolicies,
  documents,
  onSelectDocument,
  onUpdateDocumentStatus,
  onOpenReportModal
}) => {
  const [currentTab, setCurrentTab] = useState<'queue' | 'analytics' | 'policies' | 'fastapi'>('queue');
  const [localPolicy, setLocalPolicy] = useState<VerificationPolicy>(policies);
  const [newWhitelistedUni, setNewWhitelistedUni] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // FastAPI live runner state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/health');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const suspiciousCount = documents.filter(d => d.status === 'suspicious').length;

  const handleSavePolicy = () => {
    onUpdatePolicies(localPolicy);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelistedUni.trim()) return;
    if (localPolicy.whitelistedInstitutions.includes(newWhitelistedUni.trim())) return;
    setLocalPolicy(prev => ({
      ...prev,
      whitelistedInstitutions: [...prev.whitelistedInstitutions, newWhitelistedUni.trim()]
    }));
    setNewWhitelistedUni('');
  };

  const handleRemoveInstitution = (name: string) => {
    setLocalPolicy(prev => ({
      ...prev,
      whitelistedInstitutions: prev.whitelistedInstitutions.filter(u => u !== name)
    }));
  };

  const handleRunApiTest = async () => {
    setApiLoading(true);
    setApiResponse(null);
    try {
      let url = '/api/health';
      let method = 'GET';
      let body: any = null;

      if (selectedEndpoint === 'GET /api/health') {
        url = '/api/health';
      } else if (selectedEndpoint === 'GET /api/v1/openapi.json') {
        url = '/api/v1/openapi.json';
      } else if (selectedEndpoint === 'POST /api/v1/ai/analyze') {
        url = '/api/v1/ai/analyze';
        method = 'POST';
        body = JSON.stringify({
          documentTitle: 'Sample MIT AI Degree',
          documentType: 'Degree Certificate',
          institution: 'Massachusetts Institute of Technology',
          studentName: 'Marcus Vance',
          extractedText: 'Bachelor of Science in Artificial Intelligence Summa Cum Laude'
        });
      }

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body
      });
      const data = await res.json();
      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        data
      });
    } catch (err: any) {
      setApiResponse({
        error: err.message || 'Failed to reach API endpoint'
      });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Tab Selector with Emerald Glow */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/30"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Administrative Command Center
            </span>
            <span className="text-slate-400 text-xs font-mono">Live Telemetry & Examiner Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Document Verification & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Fraud Governance</span>
          </h1>
          <p className="text-xs text-slate-300">
            Review submitted credentials, inspect pixel tampering overlays, configure auto-verification limits, and test FastAPI endpoints.
          </p>
        </div>

        {/* Tab Switcher Pills with Animations */}
        <div className="flex items-center p-1.5 bg-slate-950/90 rounded-2xl border border-emerald-500/30 text-xs font-bold shadow-inner overflow-x-auto">
          <button
            id="tab-admin-queue"
            onClick={() => setCurrentTab('queue')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'queue'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SearchCheck className="w-4 h-4 stroke-[2.2]" />
            <span>Forensic Review Queue</span>
            {(pendingCount + suspiciousCount > 0) && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                currentTab === 'queue' ? 'bg-slate-950 text-emerald-300' : 'bg-rose-500 text-white'
              }`}>
                {pendingCount + suspiciousCount}
              </span>
            )}
          </button>

          <button
            id="tab-admin-analytics"
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'analytics'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 stroke-[2.2]" />
            <span>Fraud Analytics</span>
          </button>

          <button
            id="tab-admin-policies"
            onClick={() => setCurrentTab('policies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'policies'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4 stroke-[2.2]" />
            <span>Rule Policies</span>
          </button>

          <button
            id="tab-admin-fastapi"
            onClick={() => setCurrentTab('fastapi')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'fastapi'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4 text-cyan-400 stroke-[2.2]" />
            <span>FastAPI REST Runner</span>
          </button>
        </div>
      </motion.div>

      {/* TAB 1: Forensic Review Queue & Canvas Inspector */}
      {currentTab === 'queue' && (
        <div className="space-y-6">
          <VerifierReviewQueue
            documents={documents}
            currentRole="admin"
            onUpdateDocumentStatus={onUpdateDocumentStatus}
            onOpenReportModal={onOpenReportModal}
          />
        </div>
      )}

      {/* TAB 2: Analytics & KPIs */}
      {currentTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <motion.div whileHover={{ y: -3 }} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Processed</span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">{stats.totalProcessed}</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% this week
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-5 shadow-lg shadow-emerald-950/40">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Verified Valid</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {stats.authenticCount} <span className="text-xs text-slate-400 font-sans font-normal">({((stats.authenticCount / stats.totalProcessed) * 100).toFixed(1)}%)</span>
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-1">Zero fraud flags</div>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="bg-slate-900/80 border border-amber-500/40 rounded-3xl p-5 shadow-lg shadow-amber-950/40">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Flagged Suspicious</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {stats.suspiciousCount} <span className="text-xs text-slate-400 font-sans font-normal">({((stats.suspiciousCount / stats.totalProcessed) * 100).toFixed(1)}%)</span>
              </div>
              <div className="text-[11px] text-amber-300/80 mt-1">Manual review required</div>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="bg-slate-900/80 border border-rose-500/40 rounded-3xl p-5 shadow-lg shadow-rose-950/40">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Confirmed Tampered</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {stats.rejectedCount} <span className="text-xs text-slate-400 font-sans font-normal">({stats.tamperRate}%)</span>
              </div>
              <div className="text-[11px] text-rose-300/80 mt-1">Blocked & Logged</div>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-5 shadow-lg shadow-cyan-950/40">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-400 font-mono">{stats.avgLatencySeconds}s</div>
              <div className="text-[11px] text-slate-400 mt-1">Full forensic pipeline</div>
            </motion.div>

          </div>

          {/* Deep Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Detected Tamper Vectors */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Most Prevalent Tamper Vectors
                </h3>
                <span className="text-xs text-slate-400 font-mono">Last 30 Days</span>
              </div>

              <div className="space-y-3 pt-2">
                {stats.recentTamperVectors.map((v, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-semibold">{v.vector}</span>
                      <span className="text-slate-400 font-mono font-bold">{v.count} cases ({v.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${v.percentage}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-gradient-to-r from-rose-500 to-rose-400' :
                          i === 1 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                          i === 2 ? 'bg-gradient-to-r from-teal-500 to-cyan-400' :
                          'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Types Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Throughput by Document Classification
                </h3>
                <span className="text-xs text-slate-400 font-mono">1,482 Total</span>
              </div>

              <div className="space-y-3 pt-2">
                {Object.entries(stats.byDocumentType).map(([docType, countVal], idx) => {
                  const count = Number(countVal);
                  const percentage = ((count / stats.totalProcessed) * 100).toFixed(1);
                  return (
                    <div key={docType} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-semibold">{docType}</span>
                        <span className="text-slate-400 font-mono">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: Policy Configuration */}
      {currentTab === 'policies' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Fraud Detection & Auto-Verification Thresholds</h2>
              <p className="text-xs text-slate-400">
                Configure neural OCR confidence limits and digital forensics sensitivity for automatic decisions.
              </p>
            </div>

            <button
              id="btn-save-policies"
              onClick={handleSavePolicy}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{saveSuccess ? 'Saved Successfully!' : 'Save Rule Policy'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Threshold Sliders */}
            <div className="space-y-5 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Score Triage Thresholds
              </h3>

              {/* Auto Approve Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Auto-Approve Threshold:</span>
                  <span className="font-mono font-bold text-emerald-400">{localPolicy.autoApproveThreshold}% and above</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="98"
                  value={localPolicy.autoApproveThreshold}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, autoApproveThreshold: Number(e.target.value) })}
                  className="w-full accent-emerald-400"
                />
                <p className="text-[11px] text-slate-400">Documents scoring at or above this threshold receive automated attestation.</p>
              </div>

              {/* Manual Review Threshold */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Manual Review Trigger:</span>
                  <span className="font-mono font-bold text-amber-400">{localPolicy.manualReviewThreshold}% to {localPolicy.autoApproveThreshold - 1}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="75"
                  value={localPolicy.manualReviewThreshold}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, manualReviewThreshold: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
                <p className="text-[11px] text-slate-400">Scores below this threshold are flagged as High Risk Fraud.</p>
              </div>
            </div>

            {/* Forensic Feature Toggles */}
            <div className="space-y-3.5 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Forensic Inspection Modules
              </h3>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">Strict University Seal Geometry</div>
                  <div className="text-[11px] text-slate-400">Validates crest vector alignment and debossing depth</div>
                </div>
                <input
                  type="checkbox"
                  checked={localPolicy.strictSealVerification}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, strictSealVerification: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">Neural Font Kerning & Splicing Check</div>
                  <div className="text-[11px] text-slate-400">Detects font substitution on student names and grades</div>
                </div>
                <input
                  type="checkbox"
                  checked={localPolicy.enableFontKerningCheck}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, enableFontKerningCheck: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">Error Level Analysis (ELA) Noise Scan</div>
                  <div className="text-[11px] text-slate-400">Exposes multi-layer image editing and Photoshop modifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={localPolicy.enableElaAnomalyDetection}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, enableElaAnomalyDetection: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                <div>
                  <div className="text-xs font-bold text-white">QR Code & Registrar Cross-Validation</div>
                  <div className="text-[11px] text-slate-400">Queries registrar PKI servers for real-time certificate matching</div>
                </div>
                <input
                  type="checkbox"
                  checked={localPolicy.enableQrCrossValidation}
                  onChange={(e) => setLocalPolicy({ ...localPolicy, enableQrCrossValidation: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            </div>

          </div>

          {/* Whitelisted Universities */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Whitelisted Academic Issuing Authorities ({localPolicy.whitelistedInstitutions.length})
            </h3>

            <div className="flex flex-wrap gap-2">
              {localPolicy.whitelistedInstitutions.map((inst) => (
                <div key={inst} className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
                  <span>{inst}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInstitution(inst)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddInstitution} className="flex gap-2 max-w-md pt-2">
              <input
                type="text"
                value={newWhitelistedUni}
                onChange={(e) => setNewWhitelistedUni(e.target.value)}
                placeholder="Add verified university..."
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 4: FastAPI REST Runner & OpenAPI Spec */}
      {currentTab === 'fastapi' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold uppercase border border-emerald-500/30">
                  FastAPI REST Engine v2.4.0
                </span>
                <span className="text-slate-400 text-xs">Port 3000 / Reverse Proxy Ingress</span>
              </div>
              <h2 className="text-base font-black text-white mt-1">Interactive REST API Console & Test Suite</h2>
            </div>

            <button
              id="btn-run-api-endpoint"
              onClick={handleRunApiTest}
              disabled={apiLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{apiLoading ? 'Executing...' : 'Execute Request'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Endpoint Selector (4 of 12 Cols) */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Available Endpoints
              </span>

              <div className="space-y-2">
                {[
                  { name: 'GET /api/health', desc: 'System health check & Gemini engine status' },
                  { name: 'GET /api/v1/openapi.json', desc: 'FastAPI OpenAPI Schema definition' },
                  { name: 'POST /api/v1/ai/analyze', desc: 'Server-side forensic analysis payload' }
                ].map((ep) => (
                  <div
                    key={ep.name}
                    onClick={() => setSelectedEndpoint(ep.name)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                      selectedEndpoint === ep.name
                        ? 'bg-emerald-950/60 border-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono font-bold text-emerald-400">{ep.name}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{ep.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Console (8 of 12 Cols) */}
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  REST API Response Console
                </span>
                {apiResponse && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    HTTP {apiResponse.status || 200} OK
                  </span>
                )}
              </div>

              <div className="min-h-[260px] max-h-[380px] overflow-auto text-slate-300 bg-slate-900/70 p-4 rounded-xl border border-slate-800/80">
                {apiLoading ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 animate-pulse">
                    Sending REST request to FastAPI engine...
                  </div>
                ) : apiResponse ? (
                  <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 text-center py-16">
                    Click "Execute Request" above to trigger live endpoint.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
