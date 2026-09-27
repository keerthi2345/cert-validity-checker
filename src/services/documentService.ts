import { StudentDocument } from '../types';
import { apiRequest } from './api';

export const documentService = {
  async getDocuments(status?: string): Promise<StudentDocument[]> {
    try {
      const endpoint = '/api/v1/documents/my-documents';
      return await apiRequest<StudentDocument[]>(endpoint);
    } catch {
      // Fallback handled in UI components
      return [];
    }
  },

  async getDocumentById(id: string): Promise<StudentDocument | null> {
    try {
      return await apiRequest<StudentDocument>(`/api/v1/results/${id}`);
    } catch {
      return null;
    }
  },

  async uploadDocument(formData: FormData): Promise<StudentDocument> {
    return await apiRequest<StudentDocument>('/api/v1/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Let browser set multipart boundary
      }
    });
  }
};
