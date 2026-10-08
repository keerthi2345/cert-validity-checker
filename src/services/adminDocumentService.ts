import { StudentDocument, VerificationStatus } from '../types';
import { apiRequest } from './api';
import { mapDocumentSummary, mapVerificationDetail } from './adapters';

export { API_BASE_URL } from './api';

function riskFromScore(score: number): 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' {
  if (score >= 75) return 'LOW RISK';
  if (score >= 45) return 'MEDIUM RISK';
  return 'HIGH RISK';
}

/**
 * Admin verification queue / dashboard list (all documents).
 * Backend: GET /api/v1/review/all
 */
export async function getVerificationQueue(): Promise<StudentDocument[]> {
  const data = await apiRequest<any[]>('/api/v1/review/all');

  return data.map((d) => {
    const base = mapDocumentSummary(d);
    const score = d.authenticity_score ?? 0;

    return {
      ...base,
      studentId: d.student_number || '',
      authenticityScore: score,
      riskLevel: riskFromScore(score),
    };
  });
}

/**
 * Full document detail for the review page.
 * Backend: GET /api/v1/results/{id}
 */
export async function getReviewDocument(id: string): Promise<StudentDocument | null> {
  const data = await apiRequest<any>(`/api/v1/results/${encodeURIComponent(id)}`);
  return mapVerificationDetail(data);
}

export async function getVerificationResult(id: string): Promise<StudentDocument | null> {
  return getReviewDocument(id);
}

/**
 * Submit an admin decision.
 * Backend: POST /api/v1/review/{id}  (decision: "approve" | "reject")
 */
export async function submitReview(
  id: string,
  decision: VerificationStatus,
  comments: string,
  reviewerName: string = 'Administrator'
): Promise<StudentDocument> {
  if (decision !== 'valid' && decision !== 'rejected') {
    throw new Error('Only Approve (valid) or Reject decisions are supported.');
  }

  const timestamp = new Date().toISOString();

  const res = await apiRequest<any>(`/api/v1/review/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify({
      decision: decision === 'valid' ? 'approve' : 'reject',
      comments: comments.trim() || null,
    }),
  });

  const detail = await getReviewDocument(id);
  const reviewer = res.reviewed_by || reviewerName;

  const newComment = {
    id: `comm-admin-${Date.now()}`,
    authorName: reviewer,
    authorRole: 'admin' as const,
    timestamp,
    text: comments.trim() || `Document marked as ${decision.toUpperCase()} by ${reviewer}.`,
    actionTaken: decision === 'valid' ? 'Approved' : 'Rejected',
  };

  return {
    ...(detail as StudentDocument),
    status: decision,
    reviewedBy: reviewer,
    reviewedAt: timestamp,
    rejectionReason: decision === 'rejected' ? comments : undefined,
    comments: [newComment],
  };
}

export interface AdminSummaryStats {
  totalDocuments: number;
  pendingReview: number;
  valid: number;
  suspicious: number;
  rejected: number;
}

export function computeAdminStats(documents: StudentDocument[]): AdminSummaryStats {
  return {
    totalDocuments: documents.length,
    pendingReview: documents.filter((d) => d.status === 'pending').length,
    valid: documents.filter((d) => d.status === 'valid').length,
    suspicious: documents.filter((d) => d.status === 'suspicious').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
  };
}