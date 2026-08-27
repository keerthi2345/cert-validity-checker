export type UserRole = 'student' | 'admin' | 'verifier';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  institution?: string;
  avatarUrl?: string;
  token?: string;
}

export type DocumentType = 
  | '10th Marksheet'
  | '12th Marksheet'
  | 'Degree Certificate'
  | 'Migration Certificate'
  | 'Income Certificate'
  | 'Bonafide Certificate'
  | 'Provisional Certificate'
  | 'Academic Transcript';

export type VerificationStatus = 
  | 'pending'
  | 'valid'
  | 'suspicious'
  | 'rejected';

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface BoundingBox {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label: string;
  severity: AnomalySeverity;
  category: 'font_mismatch' | 'seal_tamper' | 'grade_alteration' | 'signature_forgery' | 'layout_discrepancy' | 'pixel_compression' | 'date_anomaly' | 'verified_field';
  description: string;
  confidence: number; // 0-100
  detectedValue?: string;
  expectedValue?: string;
}

export interface OcrField {
  fieldName: string;
  extractedValue: string;
  confidence: number; // 0-100
  status: 'valid' | 'warning' | 'invalid';
  boxIndex?: number;
  expectedFormat?: string;
}

export interface StructuralAnalysis {
  templateMatchScore: number; // 0-100
  layoutConsistency: number; // 0-100
  marginAlignment: 'aligned' | 'skewed' | 'irregular';
  sealPresence: boolean;
  sealIntegrityScore: number; // 0-100
  watermarkDetected: boolean;
  qrCodeDecoded: boolean;
  qrPayload?: string;
  logoVectorMatchScore: number; // 0-100
  structuralSummary: string;
}

export interface ForensicAnalysis {
  elaAnomalyScore: number; // Error Level Analysis 0-100 (higher = more anomaly)
  copyMoveArtifactsDetected: boolean;
  fontConsistencyScore: number; // 0-100
  colorSpaceDiscrepancy: boolean;
  metadataAudit: {
    creationDate: string;
    modificationDate: string;
    producerSoftware: string;
    metadataAltered: boolean;
    fileHashSha256: string;
    isEncrypted: boolean;
  };
  forensicSummary: string;
}

export interface VerificationExplanation {
  verdict: 'AUTHENTIC' | 'SUSPICIOUS_TAMPERING' | 'DEFINITIVE_FORGERY' | 'REQUIRES_EXAMINATION';
  authenticityScore: number; // 0-100
  confidenceLevel: number; // 0-100
  executiveSummary: string;
  keyFindings: Array<{
    type: 'positive' | 'negative' | 'warning';
    title: string;
    detail: string;
  }>;
  actionRecommendation: string;
}

export interface AuditComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  text: string;
  actionTaken?: string;
}

export interface StudentDocument {
  id: string;
  title: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  documentType: DocumentType;
  institution: string;
  uploadedAt: string;
  fileSize: string;
  fileName: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  status: VerificationStatus;
  authenticityScore: number; // 0-100
  riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  
  // Detailed Verification breakdown
  ocrResult: {
    rawText: string;
    fields: OcrField[];
  };
  structuralAnalysis: StructuralAnalysis;
  forensicAnalysis: ForensicAnalysis;
  explanation: VerificationExplanation;
  
  // Visual Anomaly Bounding Boxes for Viewer
  suspiciousRegions: BoundingBox[];
  
  // Reviewer actions & logs
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  comments: AuditComment[];
}

export interface SystemStats {
  totalProcessed: number;
  authenticCount: number;
  suspiciousCount: number;
  rejectedCount: number;
  pendingReviewCount: number;
  averageScore: number;
  tamperRate: number;
  avgLatencySeconds: number;
  byDocumentType: Record<string, number>;
  byRiskLevel: {
    low: number;
    medium: number;
    high: number;
  };
  recentTamperVectors: Array<{
    vector: string;
    count: number;
    percentage: number;
  }>;
}

export interface VerificationPolicy {
  autoApproveThreshold: number;
  manualReviewThreshold: number;
  strictSealVerification: boolean;
  enableFontKerningCheck: boolean;
  enableElaAnomalyDetection: boolean;
  enableQrCrossValidation: boolean;
  whitelistedInstitutions: string[];
}
