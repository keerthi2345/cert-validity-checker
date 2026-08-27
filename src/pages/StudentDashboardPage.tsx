import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { StudentDocument } from '../types';
import { Navbar } from '../components/Navbar';
import { StudentPortal } from '../components/StudentPortal';
import { VerificationResultModal } from '../components/VerificationResultModal';
import { NewUploadModal } from '../components/NewUploadModal';

interface StudentDashboardPageProps {
  documents: StudentDocument[];
  onUploadSuccess: (newDoc: StudentDocument) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  documents,
  onUploadSuccess
}) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<StudentDocument | null>(null);

  // Synchronize route `/student/documents/:id` or `/student/results/:id` with document modal
  useEffect(() => {
    if (id) {
      const found = documents.find((d) => d.id === id);
      if (found) {
        setSelectedDoc(found);
      }
    }
  }, [id, documents]);

  const handleSelectDocument = (doc: StudentDocument) => {
    setSelectedDoc(doc);
    navigate(`/student/results/${doc.id}`, { replace: false });
  };

  const handleCloseModal = () => {
    setSelectedDoc(null);
    if (location.pathname.startsWith('/student/documents/') || location.pathname.startsWith('/student/results/')) {
      navigate('/student/dashboard', { replace: true });
    }
  };

  const handleDocumentUploaded = (newDoc: StudentDocument) => {
    onUploadSuccess(newDoc);
    setSelectedDoc(newDoc);
    navigate(`/student/results/${newDoc.id}`, { replace: false });
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Animated Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Student Navbar */}
      <Navbar onOpenUpload={() => setUploadModalOpen(true)} />

      {/* Main Student Portal Content */}
      <main className="flex-1 relative z-10">
        <StudentPortal
          documents={documents}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          onSelectDocument={handleSelectDocument}
        />
      </main>

      {/* Minimal Clean Footer */}
      <footer className="bg-slate-950/80 border-t border-emerald-500/15 py-5 px-4 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-slate-300">
            VeriDoc AI • Student Document Authenticity Verification System
          </span>
          <span className="text-slate-400 text-[11px]">
            Academic Document Verification & Tamper Detection
          </span>
        </div>
      </footer>

      {/* Verification Result Modal */}
      {selectedDoc && (
        <VerificationResultModal
          document={selectedDoc}
          onClose={handleCloseModal}
        />
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <NewUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadSuccess={handleDocumentUploaded}
        />
      )}

    </div>
  );
};
