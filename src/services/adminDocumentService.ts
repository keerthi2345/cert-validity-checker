import axios from 'axios';
import { StudentDocument, VerificationStatus } from '../types';
import { ADMIN_INITIAL_DOCUMENTS } from '../data/adminMockDocuments';

const STORAGE_KEY = 'veridoc_admin_documents_store';

// Base API configuration from environment variable
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach bearer token if available
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('veridoc_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Local state persistence helpers for seamless offline/standalone testing
 */
function getLocalDocuments(): StudentDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse admin documents from localStorage', err);
  }
  // Initialize with admin mock documents
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ADMIN_INITIAL_DOCUMENTS));
  return ADMIN_INITIAL_DOCUMENTS;
}

function saveLocalDocuments(docs: StudentDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to save admin documents to localStorage', err);
  }
}

/**
 * Reusable Service Functions for Admin Verification Queue and Document Review
 */

/**
 * 1. getVerificationQueue()
 * Retrieves the list of submitted documents for the Admin Verification Queue.
 */
export async function getVerificationQueue(): Promise<StudentDocument[]> {
  // If backend base URL is provided, attempt live API call first
  if (API_BASE_URL) {
    try {
      const res = await axiosClient.get<StudentDocument[]>('/verification-queue');
      if (res.data && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('Live API call to /verification-queue failed, falling back to local store:', err);
    }
  }

  // Fallback to local store
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getLocalDocuments());
    }, 150);
  });
}

/**
 * 2. getReviewDocument(id: string)
 * Fetches a single document's metadata and visual preview details by ID.
 * Expected endpoint: GET /review/{id}
 */
export async function getReviewDocument(id: string): Promise<StudentDocument | null> {
  if (API_BASE_URL) {
    try {
      const res = await axiosClient.get<StudentDocument>(`/review/${encodeURIComponent(id)}`);
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Live API call to /review/${id} failed, falling back to local store:`, err);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const docs = getLocalDocuments();
      const doc = docs.find((d) => d.id === id) || null;
      resolve(doc);
    }, 150);
  });
}

/**
 * 3. getVerificationResult(id: string)
 * Fetches the forensic, structural, and OCR verification breakdown for a document.
 * Expected endpoint: GET /results/{id} or GET /status/{id}
 */
export async function getVerificationResult(id: string): Promise<StudentDocument | null> {
  if (API_BASE_URL) {
    try {
      const res = await axiosClient.get<StudentDocument>(`/results/${encodeURIComponent(id)}`);
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Live API call to /results/${id} failed, falling back to local store:`, err);
    }
  }

  return getReviewDocument(id);
}

/**
 * 4. submitReview(id, decision, comments, reviewerName)
 * Submits the admin review decision (Valid, Suspicious, Rejected) and reviewer comments.
 * Updates the document in the repository.
 * Expected endpoint: POST /review/{id} or POST /admin/review/submit
 */
export async function submitReview(
  id: string,
  decision: VerificationStatus,
  comments: string,
  reviewerName: string = 'Administrator'
): Promise<StudentDocument> {
  const timestamp = new Date().toISOString();

  if (API_BASE_URL) {
    try {
      const payload = {
        decision,
        comments,
        reviewerName,
        reviewedAt: timestamp
      };
      const res = await axiosClient.post<StudentDocument>(`/review/${encodeURIComponent(id)}`, payload);
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Live API call to submit review for ${id} failed, falling back to local update:`, err);
    }
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const docs = getLocalDocuments();
      const index = docs.findIndex((d) => d.id === id);

      if (index === -1) {
        reject(new Error(`Document with ID "${id}" not found.`));
        return;
      }

      const existing = docs[index];
      const newComment = {
        id: `comm-admin-${Date.now()}`,
        authorName: reviewerName,
        authorRole: 'admin' as const,
        timestamp,
        text: comments.trim() || `Document marked as ${decision.toUpperCase()} by ${reviewerName}.`,
        actionTaken: decision === 'valid' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Marked Suspicious'
      };

      const updatedDoc: StudentDocument = {
        ...existing,
        status: decision,
        reviewedBy: reviewerName,
        reviewedAt: timestamp,
        rejectionReason: decision === 'rejected' ? comments : existing.rejectionReason,
        comments: [newComment, ...(existing.comments || [])]
      };

      docs[index] = updatedDoc;
      saveLocalDocuments(docs);
      resolve(updatedDoc);
    }, 200);
  });
}

/**
 * 5. getAdminSummaryStats()
 * Computes live summary statistics for Admin dashboard cards.
 */
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
    rejected: documents.filter((d) => d.status === 'rejected').length
  };
}
