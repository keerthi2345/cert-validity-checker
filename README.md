# VeriDoc AI - Student Document Authenticity Verification System

A document authenticity verification platform built with React 18, TypeScript, Tailwind CSS, and Vite.

## Features

- **Role-Based Authentication**: Separate portals for Students and Institutional Administrators.
- **Main Landing Page**: Overview of verification capabilities and portal selection.
- **Student Portal**:
  - Upload academic credentials (Marksheets, Degree Certificates, Migration, Income, and Bonafide Certificates).
  - Document submission status tracking.
  - Interactive verification summaries.
- **Admin Verification Dashboard**:
  - Live statistics for Pending, Valid, Suspicious, and Rejected credentials.
  - Search and filterable verification queue.
- **Admin Document Review Workspace**:
  - Multi-control document canvas preview with zoom and coordinate-mapped overlays.
  - Interactive flagged anomaly inspector (Seals, Signatures, Text/Formatting anomalies).
  - 3-Layer AI Verification Breakdown (OCR & Field Extraction, Structural Analysis, Forensic Analysis).
  - Dynamic decision workflow (Pending, Suspicious, Valid, Rejected).

---

## Local Setup & Development

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` or `yarn` or `pnpm`

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The application will start locally on `http://localhost:3000` (or `http://localhost:5173` if running Vite directly).

### 3. Build for Production

```bash
npm run build
```

---

## Project Structure

```
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── public/                     # Static assets
└── src/
    ├── main.tsx                # Application entry point
    ├── App.tsx                 # Route declarations and app container
    ├── types.ts                # TypeScript interfaces and data models
    ├── context/
    │   └── AuthContext.tsx     # Authentication context provider
    ├── pages/
    │   ├── LandingPage.tsx     # Main role-selection landing page
    │   ├── LoginPage.tsx       # Student login page
    │   ├── StudentRegisterPage.tsx # Student registration page
    │   ├── AdminLoginPage.tsx  # Admin login page
    │   ├── AdminRegisterPage.tsx # Admin registration page
    │   ├── StudentDashboardPage.tsx # Student workspace & history
    │   ├── AdminDashboardPage.tsx # Admin verification queue & analytics
    │   └── AdminReviewPage.tsx # Admin forensic review & decision console
    ├── components/
    │   ├── AdminNavbar.tsx     # Administrator header navigation
    │   ├── Navbar.tsx          # Student header navigation
    │   ├── DocumentViewer.tsx  # Document canvas with zoom & overlay boxes
    │   ├── FlaggedRegionPanel.tsx # Interactive anomaly inspector
    │   ├── ConfirmationModal.tsx # Decision confirmation dialog
    │   └── ProtectedRoute.tsx  # RBAC Route guard
    └── services/
        └── adminDocumentService.ts # API service layer with mock fallback
```
