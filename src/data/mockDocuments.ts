import { StudentDocument, SystemStats, VerificationPolicy } from '../types';

export const INITIAL_POLICIES: VerificationPolicy = {
  autoApproveThreshold: 88,
  manualReviewThreshold: 60,
  strictSealVerification: true,
  enableFontKerningCheck: true,
  enableElaAnomalyDetection: true,
  enableQrCrossValidation: true,
  whitelistedInstitutions: [
    'Central Board of Secondary Education',
    'State Board of Secondary Education',
    'State Technical University',
    'National Institute of Technology',
    'Government Engineering College',
    'State University Examination Authority',
    'Department of Higher Education'
  ]
};

export const INITIAL_DOCUMENTS: StudentDocument[] = [
  {
    id: 'DOC-2026-8941',
    title: '12th Marksheet - Senior School Certificate Examination',
    studentName: 'Aarav Sharma',
    studentId: '2025-XII-88421',
    studentEmail: 'aarav.sharma2025@example.edu.in',
    documentType: '12th Marksheet',
    institution: 'Central Board of Secondary Education (CBSE)',
    uploadedAt: '2026-08-18T14:32:00Z',
    fileSize: '2.1 MB',
    fileName: '12th_Marksheet_Aarav_Sharma.pdf',
    status: 'valid',
    authenticityScore: 96,
    riskLevel: 'LOW RISK',
    ocrResult: {
      rawText: 'CENTRAL BOARD OF SECONDARY EDUCATION\nMARKS STATEMENT & CERTIFICATE\nALL INDIA SENIOR SCHOOL CERTIFICATE EXAMINATION 2025\nCandidate Name: AARAV SHARMA\nRoll No: 2025-XII-88421\nSchool: Delhi Public School, R.K. Puram\nPhysics: 95 | Chemistry: 94 | Mathematics: 98 | Computer Science: 97 | English: 92\nResult: PASS (FIRST DIVISION WITH DISTINCTION)\nDate of Issue: 22/05/2025\nController of Examinations: S. K. Sanyal',
      fields: [
        { fieldName: 'Candidate Name', extractedValue: 'AARAV SHARMA', confidence: 99.5, status: 'valid' },
        { fieldName: 'Roll Number', extractedValue: '2025-XII-88421', confidence: 99.1, status: 'valid' },
        { fieldName: 'Examination Board', extractedValue: 'Central Board of Secondary Education', confidence: 99.8, status: 'valid' },
        { fieldName: 'Examination Year', extractedValue: '2025', confidence: 98.6, status: 'valid' },
        { fieldName: 'Overall Aggregate', extractedValue: '95.2%', confidence: 99.0, status: 'valid' },
        { fieldName: 'Result Status', extractedValue: 'PASS WITH DISTINCTION', confidence: 99.4, status: 'valid' }
      ]
    },
    structuralAnalysis: {
      templateMatchScore: 98.2,
      layoutConsistency: 99.0,
      marginAlignment: 'aligned',
      sealPresence: true,
      sealIntegrityScore: 97.1,
      watermarkDetected: true,
      qrCodeDecoded: true,
      qrPayload: 'https://cbse.gov.in/verify/2025-XII-88421-AUTH',
      logoVectorMatchScore: 98.5,
      structuralSummary: 'Matches standard CBSE Senior Secondary Examination certificate template with genuine emblem layout and uniform typography.'
    },
    forensicAnalysis: {
      elaAnomalyScore: 4.1,
      copyMoveArtifactsDetected: false,
      fontConsistencyScore: 98.8,
      colorSpaceDiscrepancy: false,
      metadataAudit: {
        creationDate: '2025-05-22T09:12:44Z',
        modificationDate: '2025-05-22T09:12:44Z',
        producerSoftware: 'CBSE Digital Locker Issuance Engine v4.2',
        metadataAltered: false,
        fileHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        isEncrypted: false
      },
      forensicSummary: 'No localized compression anomalies or pixel manipulation detected. Font kerning across marks table adheres strictly to board specifications.'
    },
    explanation: {
      verdict: 'AUTHENTIC',
      authenticityScore: 96,
      confidenceLevel: 98.2,
      executiveSummary: 'The document shows zero indicators of tampering or digital manipulation. Board security seals, layout alignment, and OCR entity values match standard issuance records.',
      keyFindings: [
        { type: 'positive', title: 'Official Board Seal Verified', detail: 'Embossed emblem vector geometry exhibits zero distortion.' },
        { type: 'positive', title: 'Consistent Font Kerning', detail: 'All grade values and subject lines adhere to original typesetting parameters.' },
        { type: 'positive', title: 'Valid Document Layout', detail: 'Margins, micro-print borders, and header alignments match official CBSE template.' }
      ],
      actionRecommendation: 'Verified as valid. No manual review required.'
    },
    suspiciousRegions: [
      {
        id: 'box-cbse-1',
        x: 15,
        y: 8,
        width: 70,
        height: 12,
        label: 'Official Board Header',
        severity: 'info',
        category: 'verified_field',
        description: 'Authentic vector emblem and official CBSE typography.',
        confidence: 99.2
      },
      {
        id: 'box-cbse-2',
        x: 68,
        y: 80,
        width: 22,
        height: 14,
        label: 'Board Seal & Controller Signature',
        severity: 'info',
        category: 'verified_field',
        description: 'Authentic digital signature and seal stamp.',
        confidence: 98.4
      }
    ],
    reviewedBy: 'Auto-Verification Pipeline',
    reviewedAt: '2026-08-18T14:33:10Z',
    comments: [
      {
        id: 'comm-1',
        authorName: 'Verification System',
        authorRole: 'admin',
        timestamp: '2026-08-18T14:33:10Z',
        text: 'Document validated with 96% authenticity rating. Marked as Valid.',
        actionTaken: 'Approved'
      }
    ]
  },
  {
    id: 'DOC-2026-7732',
    title: 'Bachelor of Technology Degree Certificate',
    studentName: 'Rohan Verma',
    studentId: '2024-BT-10492',
    studentEmail: 'rohan.verma.candidate@example.ac.in',
    documentType: 'Degree Certificate',
    institution: 'State Technical University',
    uploadedAt: '2026-08-19T06:15:00Z',
    fileSize: '3.4 MB',
    fileName: 'BTech_Degree_RohanVerma.png',
    status: 'rejected',
    authenticityScore: 28,
    riskLevel: 'HIGH RISK',
    ocrResult: {
      rawText: 'STATE TECHNICAL UNIVERSITY\nUPON THE RECOMMENDATION OF THE ACADEMIC COUNCIL\nCONFERS UPON\nROHAN VERMA\nTHE DEGREE OF BACHELOR OF TECHNOLOGY IN COMPUTER ENGINEERING\nWITH FIRST CLASS WITH DISTINCTION (CGPA 9.85)\nJULY 2024\nREGISTRAR & VICE CHANCELLOR',
      fields: [
        { fieldName: 'Candidate Name', extractedValue: 'ROHAN VERMA', confidence: 52.4, status: 'invalid', expectedFormat: 'Font mismatch with original certificate template' },
        { fieldName: 'University Name', extractedValue: 'State Technical University', confidence: 97.8, status: 'valid' },
        { fieldName: 'Degree Awarded', extractedValue: 'Bachelor of Technology in Computer Engineering', confidence: 61.2, status: 'warning', expectedFormat: 'Branch name baseline is skewed' },
        { fieldName: 'Classification / CGPA', extractedValue: 'FIRST CLASS WITH DISTINCTION (9.85)', confidence: 39.5, status: 'invalid', expectedFormat: 'Altered text layer detected' },
        { fieldName: 'Conferral Date', extractedValue: 'JULY 2024', confidence: 86.0, status: 'valid' }
      ]
    },
    structuralAnalysis: {
      templateMatchScore: 48.5,
      layoutConsistency: 54.0,
      marginAlignment: 'skewed',
      sealPresence: true,
      sealIntegrityScore: 32.0,
      watermarkDetected: false,
      qrCodeDecoded: false,
      logoVectorMatchScore: 61.4,
      structuralSummary: 'Critical layout distortions detected. The student name and honors classification areas exhibit cut-and-paste boundary artifacts and font kerning inconsistencies.'
    },
    forensicAnalysis: {
      elaAnomalyScore: 84.7,
      copyMoveArtifactsDetected: true,
      fontConsistencyScore: 41.2,
      colorSpaceDiscrepancy: true,
      metadataAudit: {
        creationDate: '2024-07-20T11:00:00Z',
        modificationDate: '2026-08-18T22:14:09Z',
        producerSoftware: 'Adobe Photoshop 2024 (Windows) / Exported PNG',
        metadataAltered: true,
        fileHashSha256: 'a6c9e01f55b991b49e5d4400e998811223344556677889900aabbccddeeff001',
        isEncrypted: false
      },
      forensicSummary: 'Error Level Analysis highlights distinct compression differences around the recipient name and CGPA figures, confirming digital alteration after original export.'
    },
    explanation: {
      verdict: 'DEFINITIVE_FORGERY',
      authenticityScore: 28,
      confidenceLevel: 94.6,
      executiveSummary: 'High-probability document tampering detected. Multiple forensic tests confirm modification of candidate name and grade honors with external software.',
      keyFindings: [
        { type: 'negative', title: 'Pixel Compression Discrepancy (ELA)', detail: 'Localized compression noise spikes (84.7%) over candidate name and honors text.' },
        { type: 'negative', title: 'Editing Software Detected in Metadata', detail: 'File header contains Adobe Photoshop modification tags dated recent to upload.' },
        { type: 'negative', title: 'Font Baseline & Kerning Mismatch', detail: 'Inserted text uses non-standard typeface not present on genuine university certificates.' }
      ],
      actionRecommendation: 'Rejected due to detected tampering. Candidate and verification authority alerted.'
    },
    suspiciousRegions: [
      {
        id: 'box-stu-tamper-1',
        x: 22,
        y: 38,
        width: 56,
        height: 8,
        label: 'Candidate Name Tampering',
        severity: 'critical',
        category: 'font_mismatch',
        description: 'Text layer pasted over original recipient name. Mismatched font kerning.',
        confidence: 96.8,
        detectedValue: 'ROHAN VERMA',
        expectedValue: 'Original Student Name'
      },
      {
        id: 'box-stu-tamper-2',
        x: 18,
        y: 54,
        width: 64,
        height: 9,
        label: 'CGPA / Distinction Modification',
        severity: 'high',
        category: 'grade_alteration',
        description: 'Compression noise artifact around "9.85" and "FIRST CLASS WITH DISTINCTION".',
        confidence: 91.2,
        detectedValue: '9.85 / DISTINCTION',
        expectedValue: '7.12 / FIRST CLASS'
      }
    ],
    reviewedBy: 'Administrator',
    reviewedAt: '2026-08-19T07:20:00Z',
    rejectionReason: 'Font and typography splicing identified on recipient name and grade values.',
    comments: [
      {
        id: 'comm-2',
        authorName: 'System Administrator',
        authorRole: 'admin',
        timestamp: '2026-08-19T07:20:00Z',
        text: 'Confirmed image alteration artifacts over name and degree classification. Document rejected.',
        actionTaken: 'Rejected'
      }
    ]
  },
  {
    id: 'DOC-2026-5520',
    title: '10th Marksheet - Secondary School Examination',
    studentName: 'Priya Patel',
    studentId: '2023-X-55910',
    studentEmail: 'priya.patel.academic@example.com',
    documentType: '10th Marksheet',
    institution: 'State Board of Secondary Education',
    uploadedAt: '2026-08-17T11:45:00Z',
    fileSize: '1.8 MB',
    fileName: '10th_Marksheet_PriyaPatel.jpg',
    status: 'suspicious',
    authenticityScore: 64,
    riskLevel: 'MEDIUM RISK',
    ocrResult: {
      rawText: 'STATE BOARD OF SECONDARY EDUCATION\nSECONDARY SCHOOL CERTIFICATE EXAMINATION 2023\nRoll No: 2023-X-55910 | Center: 4022\nCandidate: PRIYA PATEL | D.O.B: 14/08/2007\nFirst Language: 88 | Second Language: 90 | Mathematics: 79 | Science: 82 | Social Studies: 86\nTotal: 425/500 | Grade: A\nIssue Date: 18/06/2023',
      fields: [
        { fieldName: 'Candidate Name', extractedValue: 'PRIYA PATEL', confidence: 96.0, status: 'valid' },
        { fieldName: 'Roll Number', extractedValue: '2023-X-55910', confidence: 94.2, status: 'valid' },
        { fieldName: 'Date of Birth', extractedValue: '14/08/2007', confidence: 68.4, status: 'warning', expectedFormat: 'Minor pixel blur on year digits "2007"' },
        { fieldName: 'Board Name', extractedValue: 'State Board of Secondary Education', confidence: 98.2, status: 'valid' },
        { fieldName: 'Total Marks', extractedValue: '425 / 500', confidence: 91.0, status: 'valid' },
        { fieldName: 'Grade', extractedValue: 'Grade A', confidence: 71.5, status: 'warning', expectedFormat: 'Letter spacing slightly wide' }
      ]
    },
    structuralAnalysis: {
      templateMatchScore: 82.0,
      layoutConsistency: 78.5,
      marginAlignment: 'aligned',
      sealPresence: true,
      sealIntegrityScore: 74.0,
      watermarkDetected: true,
      qrCodeDecoded: false,
      logoVectorMatchScore: 88.0,
      structuralSummary: 'Layout conforms generally to State Board standard, but the Date of Birth and Grade columns show micro-contrast variances requiring closer inspection.'
    },
    forensicAnalysis: {
      elaAnomalyScore: 42.6,
      copyMoveArtifactsDetected: false,
      fontConsistencyScore: 76.5,
      colorSpaceDiscrepancy: false,
      metadataAudit: {
        creationDate: '2023-06-18T10:30:00Z',
        modificationDate: '2026-08-16T14:11:00Z',
        producerSoftware: 'Flatbed Scanner Utility / Generic JPEG',
        metadataAltered: false,
        fileHashSha256: 'b7d8e23f00a982c741e24500998811223344556677889900aabbccddeeff002',
        isEncrypted: false
      },
      forensicSummary: 'Moderate compression variance located around the Date of Birth text block. Could be compression artifact from scan compression or minor numeric touchup.'
    },
    explanation: {
      verdict: 'SUSPICIOUS_TAMPERING',
      authenticityScore: 64,
      confidenceLevel: 81.0,
      executiveSummary: 'Document shows potential anomalies in the Date of Birth field and Grade column. Requires manual review by an administrator.',
      keyFindings: [
        { type: 'warning', title: 'Date of Birth Micro-Contrast Variance', detail: 'Year digits exhibit localized blur and higher compression variance than surrounding text.' },
        { type: 'positive', title: 'Board Emblem & Layout Verified', detail: 'Emblem vectors, border micro-text, and candidate name are consistent with original template.' }
      ],
      actionRecommendation: 'Flagged as Suspicious. Manual administrative check recommended.'
    },
    suspiciousRegions: [
      {
        id: 'box-sbse-dob',
        x: 48,
        y: 28,
        width: 32,
        height: 7,
        label: 'Date of Birth Field Variance',
        severity: 'medium',
        category: 'date_anomaly',
        description: 'Minor pixel smoothing and contrast discrepancy on year digits "2007".',
        confidence: 76.4,
        detectedValue: '14/08/2007',
        expectedValue: '14/08/2006 (or original scan value)'
      }
    ],
    comments: [
      {
        id: 'comm-3',
        authorName: 'Automated Inspector',
        authorRole: 'admin',
        timestamp: '2026-08-17T11:46:12Z',
        text: 'Document flagged as Suspicious due to Date of Birth field variance. Queued for review.',
        actionTaken: 'Flagged'
      }
    ]
  },
  {
    id: 'DOC-2026-4419',
    title: 'Bonafide Student Certificate',
    studentName: 'Kavya Nair',
    studentId: '2025-BE-03214',
    studentEmail: 'kavya.nair@gec.ac.in',
    documentType: 'Bonafide Certificate',
    institution: 'Government Engineering College',
    uploadedAt: '2026-08-19T08:30:00Z',
    fileSize: '1.4 MB',
    fileName: 'Bonafide_Certificate_KavyaNair.pdf',
    status: 'pending',
    authenticityScore: 92,
    riskLevel: 'LOW RISK',
    ocrResult: {
      rawText: 'GOVERNMENT ENGINEERING COLLEGE\nOFFICE OF THE PRINCIPAL & DEAN OF ACADEMICS\nBONAFIDE CERTIFICATE\nThis is to certify that Ms. Kavya Nair, bearing Roll No: 2025-BE-03214, is a bonafide student of this institution studying in B.E. Electrical & Electronics Engineering during Academic Year 2025-2026.\nPrincipal Signature: Dr. M. G. Raman\nDate: 12/08/2025',
      fields: [
        { fieldName: 'Student Name', extractedValue: 'Ms. Kavya Nair', confidence: 99.2, status: 'valid' },
        { fieldName: 'Roll Number', extractedValue: '2025-BE-03214', confidence: 98.8, status: 'valid' },
        { fieldName: 'Department', extractedValue: 'Electrical & Electronics Engineering', confidence: 98.0, status: 'valid' },
        { fieldName: 'Academic Year', extractedValue: '2025-2026', confidence: 99.0, status: 'valid' },
        { fieldName: 'Issuing Authority', extractedValue: 'Principal, Government Engineering College', confidence: 97.4, status: 'valid' }
      ]
    },
    structuralAnalysis: {
      templateMatchScore: 94.0,
      layoutConsistency: 96.0,
      marginAlignment: 'aligned',
      sealPresence: true,
      sealIntegrityScore: 93.0,
      watermarkDetected: false,
      qrCodeDecoded: false,
      logoVectorMatchScore: 95.0,
      structuralSummary: 'Institutional letterhead format, official college stamp, and signature alignment conform to standard institutional guidelines.'
    },
    forensicAnalysis: {
      elaAnomalyScore: 8.0,
      copyMoveArtifactsDetected: false,
      fontConsistencyScore: 97.5,
      colorSpaceDiscrepancy: false,
      metadataAudit: {
        creationDate: '2025-08-12T10:00:00Z',
        modificationDate: '2025-08-12T10:00:00Z',
        producerSoftware: 'College Administration Management System v2.1',
        metadataAltered: false,
        fileHashSha256: 'c8e9f1234567890abcdef0123456789abcdef0123456789abcdef0123456789a',
        isEncrypted: false
      },
      forensicSummary: 'Uniform pixel structure with no compression artifacts. Seal stamp exhibits genuine ink bleed characteristics.'
    },
    explanation: {
      verdict: 'AUTHENTIC',
      authenticityScore: 92,
      confidenceLevel: 95.0,
      executiveSummary: 'Document ingested successfully and preliminary authenticity score computed. Pending final administrative confirmation.',
      keyFindings: [
        { type: 'positive', title: 'Institutional Letterhead Match', detail: 'Header text and college seal conform to registered institutional template.' },
        { type: 'positive', title: 'Uniform Font & Baseline', detail: 'Consistent typography throughout certificate body text.' }
      ],
      actionRecommendation: 'Pending review. Document meets auto-verification criteria.'
    },
    suspiciousRegions: [],
    comments: []
  },
  {
    id: 'DOC-2026-3108',
    title: 'University Migration Certificate',
    studentName: 'Siddharth Rao',
    studentId: '2024-MIG-7712',
    studentEmail: 'siddharth.rao@example.edu.in',
    documentType: 'Migration Certificate',
    institution: 'State University Examination Authority',
    uploadedAt: '2026-08-16T15:20:00Z',
    fileSize: '1.9 MB',
    fileName: 'Migration_Certificate_SiddharthRao.pdf',
    status: 'valid',
    authenticityScore: 98,
    riskLevel: 'LOW RISK',
    ocrResult: {
      rawText: 'STATE UNIVERSITY EXAMINATION AUTHORITY\nMIGRATION CERTIFICATE\nSerial No: MIG-2024-7712\nThis is to certify that Siddharth Rao, Registration No: 2024-MIG-7712, has completed the course of study and has no dues or disciplinary inquiries pending.\nRegistrar Signature: Dr. A. V. Deshmukh\nDate of Issue: 05/07/2024',
      fields: [
        { fieldName: 'Candidate Name', extractedValue: 'Siddharth Rao', confidence: 99.6, status: 'valid' },
        { fieldName: 'Registration Number', extractedValue: '2024-MIG-7712', confidence: 99.4, status: 'valid' },
        { fieldName: 'Issuing Institution', extractedValue: 'State University Examination Authority', confidence: 99.8, status: 'valid' },
        { fieldName: 'Certificate Serial', extractedValue: 'MIG-2024-7712', confidence: 99.2, status: 'valid' }
      ]
    },
    structuralAnalysis: {
      templateMatchScore: 99.0,
      layoutConsistency: 99.4,
      marginAlignment: 'aligned',
      sealPresence: true,
      sealIntegrityScore: 98.2,
      watermarkDetected: true,
      qrCodeDecoded: true,
      qrPayload: 'https://stateuniv.edu.in/verify/MIG-2024-7712',
      logoVectorMatchScore: 99.1,
      structuralSummary: 'Matches registered university migration certificate security template with intact vector seal and verifiable QR payload.'
    },
    forensicAnalysis: {
      elaAnomalyScore: 3.2,
      copyMoveArtifactsDetected: false,
      fontConsistencyScore: 99.2,
      colorSpaceDiscrepancy: false,
      metadataAudit: {
        creationDate: '2024-07-05T08:15:00Z',
        modificationDate: '2024-07-05T08:15:00Z',
        producerSoftware: 'State University Digital Issuance Portal v3.8',
        metadataAltered: false,
        fileHashSha256: 'd9e0f11223344556677889900aabbccddeeff0011223344556677889900aabbc',
        isEncrypted: false
      },
      forensicSummary: 'No localized compression anomalies or pixel cloning found. Font metrics conform exactly to official university standard.'
    },
    explanation: {
      verdict: 'AUTHENTIC',
      authenticityScore: 98,
      confidenceLevel: 99.0,
      executiveSummary: 'Document is authentic with valid security seal, QR link, and zero pixel manipulation.',
      keyFindings: [
        { type: 'positive', title: 'Official Digital Seal Verified', detail: 'Vector seal matches university registry database.' },
        { type: 'positive', title: 'Valid QR Code Payload', detail: 'QR link decodes to official registrar verification portal.' }
      ],
      actionRecommendation: 'Verified as valid. No further action needed.'
    },
    suspiciousRegions: [],
    reviewedBy: 'Verification System',
    reviewedAt: '2026-08-16T15:22:00Z',
    comments: [
      {
        id: 'comm-4',
        authorName: 'System Administrator',
        authorRole: 'admin',
        timestamp: '2026-08-16T15:22:00Z',
        text: 'Document validated with 98% authenticity rating. Marked as Valid.',
        actionTaken: 'Approved'
      }
    ]
  },
  {
    id: 'DOC-2026-2094',
    title: 'Income & Asset Certificate',
    studentName: 'Ananya Gupta',
    studentId: '2025-INC-4029',
    studentEmail: 'ananya.gupta@example.gov.in',
    documentType: 'Income Certificate',
    institution: 'Revenue Department & District Administration',
    uploadedAt: '2026-08-15T09:10:00Z',
    fileSize: '1.6 MB',
    fileName: 'Income_Certificate_AnanyaGupta.pdf',
    status: 'valid',
    authenticityScore: 95,
    riskLevel: 'LOW RISK',
    ocrResult: {
      rawText: 'GOVERNMENT REVENUE DEPARTMENT\nDISTRICT MAGISTRATE / TAHSILDAR OFFICE\nINCOME & ASSET CERTIFICATE\nCertificate No: INC-2025-4029\nThis is to certify that Ms. Ananya Gupta, D/O Shri R. K. Gupta, resident of Ward 14, has an annual family income from all sources of Rs. 2,40,000/-.\nTahsildar Signature & Digital Token: TAH-REV-8891\nDate of Issue: 10/05/2025',
      fields: [
        { fieldName: 'Candidate Name', extractedValue: 'Ms. Ananya Gupta', confidence: 99.1, status: 'valid' },
        { fieldName: 'Certificate Number', extractedValue: 'INC-2025-4029', confidence: 99.0, status: 'valid' },
        { fieldName: 'Annual Family Income', extractedValue: 'Rs. 2,40,000 / annum', confidence: 98.4, status: 'valid' },
        { fieldName: 'Issuing Authority', extractedValue: 'Tahsildar / Revenue Department', confidence: 99.2, status: 'valid' }
      ]
    },
    structuralAnalysis: {
      templateMatchScore: 96.5,
      layoutConsistency: 97.0,
      marginAlignment: 'aligned',
      sealPresence: true,
      sealIntegrityScore: 95.8,
      watermarkDetected: true,
      qrCodeDecoded: true,
      qrPayload: 'https://edistrict.gov.in/verify/INC-2025-4029',
      logoVectorMatchScore: 97.2,
      structuralSummary: 'Standard e-District revenue department template with authentic government emblem and verified digital signature.'
    },
    forensicAnalysis: {
      elaAnomalyScore: 5.1,
      copyMoveArtifactsDetected: false,
      fontConsistencyScore: 98.0,
      colorSpaceDiscrepancy: false,
      metadataAudit: {
        creationDate: '2025-05-10T11:20:00Z',
        modificationDate: '2025-05-10T11:20:00Z',
        producerSoftware: 'e-District Digital Signature Gateway v5.0',
        metadataAltered: false,
        fileHashSha256: 'e1f2034567890abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        isEncrypted: false
      },
      forensicSummary: 'No localized compression anomalies or pixel alterations found.'
    },
    explanation: {
      verdict: 'AUTHENTIC',
      authenticityScore: 95,
      confidenceLevel: 97.5,
      executiveSummary: 'Certificate verified against e-District template with valid signature and seal.',
      keyFindings: [
        { type: 'positive', title: 'Valid e-District Digital Signature', detail: 'Issuing officer digital signature token verified.' },
        { type: 'positive', title: 'Authentic Revenue Department Seal', detail: 'State emblem and micro-text borders intact.' }
      ],
      actionRecommendation: 'Verified as valid. No manual examination required.'
    },
    suspiciousRegions: [],
    reviewedBy: 'Verification System',
    reviewedAt: '2026-08-15T09:12:00Z',
    comments: [
      {
        id: 'comm-5',
        authorName: 'System Administrator',
        authorRole: 'admin',
        timestamp: '2026-08-15T09:12:00Z',
        text: 'Document validated with 95% authenticity rating. Marked as Valid.',
        actionTaken: 'Approved'
      }
    ]
  }
];

export const INITIAL_STATS: SystemStats = {
  totalProcessed: 1482,
  authenticCount: 1198,
  suspiciousCount: 164,
  rejectedCount: 120,
  pendingReviewCount: 12,
  averageScore: 84.6,
  tamperRate: 8.1,
  avgLatencySeconds: 1.84,
  byDocumentType: {
    '10th Marksheet': 420,
    '12th Marksheet': 510,
    'Degree Certificate': 310,
    'Migration Certificate': 112,
    'Income Certificate': 80,
    'Bonafide Certificate': 50
  },
  byRiskLevel: {
    low: 1198,
    medium: 164,
    high: 120
  },
  recentTamperVectors: [
    { vector: 'Font Kerning & Typography Splicing', count: 74, percentage: 38.5 },
    { vector: 'Grade / Score Inflation', count: 52, percentage: 27.1 },
    { vector: 'Seal & Watermark Cut-and-Paste', count: 36, percentage: 18.8 },
    { vector: 'Date of Birth / Date Tampering', count: 18, percentage: 9.4 },
    { vector: 'Metadata & EXIF Inconsistency', count: 12, percentage: 6.2 }
  ]
};
