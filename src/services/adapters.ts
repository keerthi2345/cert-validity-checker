import {
  StudentDocument,
  VerificationStatus,
  OcrField,
  StructuralAnalysis,
  ForensicAnalysis,
  VerificationExplanation,
} from '../types';

function mapStatus(status: string): VerificationStatus {
  const s = (status || '').toLowerCase();
  if (s === 'valid') return 'valid';
  if (s === 'suspicious') return 'suspicious';
  if (s === 'rejected' || s === 'likely forged') return 'rejected';
  return 'pending';
}

function riskFromScore(score: number): 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' {
  if (score >= 75) return 'LOW RISK';
  if (score >= 45) return 'MEDIUM RISK';
  return 'HIGH RISK';
}

// Maps the lightweight list item from GET /api/v1/documents/my-documents
// (no score/analysis yet available at this stage — filled in once opened)
export function mapDocumentSummary(apiDoc: any): StudentDocument {
  return {
    id: apiDoc.document_id,
    title: apiDoc.file_name,
    studentName: '',
    studentId: '',
    studentEmail: '',
    documentType: 'Academic Transcript',
    institution: 'Not evaluated',
    uploadedAt: apiDoc.uploaded_at,
    fileSize: '',
    fileName: apiDoc.file_name,
    status: mapStatus(apiDoc.status),
    authenticityScore: 0,
    riskLevel: 'LOW RISK',
    ocrResult: { rawText: '', fields: [] },
    structuralAnalysis: emptyStructural(),
    forensicAnalysis: emptyForensic(),
    explanation: emptyExplanation(),
    suspiciousRegions: [],
    comments: [],
  };
}

// Maps the full detail response from GET /api/v1/results/{id}
export function mapVerificationDetail(api: any): StudentDocument {
  const ocr = safeParse(api.ocr_result);
  const forensicWrapper = safeParse(api.forensic_result);
  const forensic = forensicWrapper?.forensic_result || {};
  const finalResult = forensic.final_result || {};

  const score = api.authenticity_score ?? Math.round((finalResult.authenticity_score || 0) * 100);

  return {
    id: api.document_id,
    title: api.file_name,
    studentName: '',
    studentId: '',
    studentEmail: '',
    documentType: (ocr?.doc_type as any) || 'Academic Transcript',
    institution: 'Not evaluated',
    uploadedAt: api.created_at,
    fileSize: '',
    fileName: api.file_name,
    status: mapStatus(api.document_status || api.final_status),
    authenticityScore: score,
    riskLevel: riskFromScore(score),
    ocrResult: mapOcrResult(ocr),
    structuralAnalysis: mapStructural(forensic),
    forensicAnalysis: mapForensic(forensic),
    explanation: mapExplanation(finalResult, score),
    suspiciousRegions: [],
    comments: [],
  };
}

function safeParse(value: any) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapOcrResult(ocr: any): { rawText: string; fields: OcrField[] } {
  if (!ocr) return { rawText: '', fields: [] };
  const fields: OcrField[] = Object.entries(ocr.extracted_fields || {}).map(([key, value]) => ({
    fieldName: key,
    extractedValue: value === null || value === undefined ? '' : String(value),
    confidence: 90,
    status: value ? 'valid' : 'warning',
  }));
  return { rawText: ocr.raw_table_text || '', fields };
}

function mapStructural(forensic: any): StructuralAnalysis {
  const s = forensic.structural_checks || {};
  return {
    templateMatchScore: 0,
    layoutConsistency: 0,
    marginAlignment: 'aligned',
    sealPresence: !!s.seal?.seal_present,
    sealIntegrityScore: s.seal?.seal_present ? 100 : 0,
    watermarkDetected: false,
    qrCodeDecoded: false,
    logoVectorMatchScore: s.letterhead?.letterhead_likely ? 100 : 0,
    structuralSummary:
      `Seal ${s.seal?.seal_present ? 'detected' : 'not detected'}; ` +
      `signature ${s.signature?.signature_likely ? 'detected' : 'not detected'}; ` +
      `font consistency ${s.font?.consistent ? 'normal' : 'flagged'}.`,
  };
}

function mapForensic(forensic: any): ForensicAnalysis {
  const ela = forensic.ela || {};
  const copyMove = forensic.copy_move || {};
  const metadata = forensic.metadata || {};
  return {
    elaAnomalyScore: ela.mean_error_level ?? 0,
    copyMoveArtifactsDetected: !!copyMove.copy_move_detected,
    fontConsistencyScore: forensic.structural_checks?.font?.consistent ? 95 : 40,
    colorSpaceDiscrepancy: false,
    metadataAudit: {
      creationDate: metadata.creation_date || 'Not evaluated',
      modificationDate: metadata.mod_date || 'Not evaluated',
      producerSoftware: metadata.producer || metadata.software || 'Not evaluated',
      metadataAltered: !!(metadata.modified_after_creation || metadata.suspicious),
      fileHashSha256: 'Not evaluated',
      isEncrypted: false,
    },
    forensicSummary: (finalExplanation(forensic) || []).join(' '),
  };
}

function finalExplanation(forensic: any): string[] {
  return forensic.final_result?.explanation || [];
}

function mapExplanation(finalResult: any, score: number): VerificationExplanation {
  const label = finalResult.label || 'Suspicious';
  const verdict =
    label === 'Valid' ? 'AUTHENTIC' : label === 'Likely Forged' ? 'DEFINITIVE_FORGERY' : 'SUSPICIOUS_TAMPERING';
  const findings = (finalResult.explanation || []).map((text: string) => ({
    type: text.toLowerCase().includes('no issues') ? 'positive' : 'negative',
    title: text,
    detail: text,
  }));
  return {
    verdict,
    authenticityScore: score,
    confidenceLevel: 90,
    executiveSummary: (finalResult.explanation || []).join(' '),
    keyFindings: findings,
    actionRecommendation:
      verdict === 'AUTHENTIC' ? 'Verified as valid. No manual review required.' : 'Flagged for manual review.',
  };
}

function emptyStructural(): StructuralAnalysis {
  return {
    templateMatchScore: 0,
    layoutConsistency: 0,
    marginAlignment: 'aligned',
    sealPresence: false,
    sealIntegrityScore: 0,
    watermarkDetected: false,
    qrCodeDecoded: false,
    logoVectorMatchScore: 0,
    structuralSummary: 'Not evaluated yet.',
  };
}

function emptyForensic(): ForensicAnalysis {
  return {
    elaAnomalyScore: 0,
    copyMoveArtifactsDetected: false,
    fontConsistencyScore: 0,
    colorSpaceDiscrepancy: false,
    metadataAudit: {
      creationDate: 'Not evaluated',
      modificationDate: 'Not evaluated',
      producerSoftware: 'Not evaluated',
      metadataAltered: false,
      fileHashSha256: 'Not evaluated',
      isEncrypted: false,
    },
    forensicSummary: 'Not evaluated yet.',
  };
}

function emptyExplanation(): VerificationExplanation {
  return {
    verdict: 'REQUIRES_EXAMINATION',
    authenticityScore: 0,
    confidenceLevel: 0,
    executiveSummary: 'Processing not yet complete.',
    keyFindings: [],
    actionRecommendation: 'Check back shortly.',
  };
}