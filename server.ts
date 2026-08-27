import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Lazy Gemini client helper
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return geminiClient;
  }

  // --- REST API (FastAPI-compatible endpoints) ---
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "FastAPI Document Authenticity Verification Engine",
      version: "2.4.0",
      timestamp: new Date().toISOString(),
      geminiAiEnabled: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // OpenAPI Specification for FastAPI compatibility
  app.get("/api/v1/openapi.json", (req, res) => {
    res.json({
      openapi: "3.1.0",
      info: {
        title: "Student Document Authenticity Verification API (FastAPI)",
        description: "High-throughput forensic OCR, structural template alignment, and pixel anomaly detection for academic credentials.",
        version: "2.4.0",
      },
      paths: {
        "/api/v1/documents": {
          get: {
            summary: "List all submitted documents with filter criteria",
            parameters: [
              { name: "status", in: "query", schema: { type: "string" } },
              { name: "role", in: "query", schema: { type: "string" } },
              { name: "search", in: "query", schema: { type: "string" } },
            ],
            responses: { "200": { description: "List of Student Documents" } },
          },
        },
        "/api/v1/documents/upload": {
          post: {
            summary: "Upload document and trigger automated forensic OCR pipeline",
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      documentType: { type: "string" },
                      institution: { type: "string" },
                      studentName: { type: "string" },
                      fileData: { type: "string", description: "Base64 encoded file" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Document queued and verified" } },
          },
        },
        "/api/v1/documents/{document_id}": {
          get: {
            summary: "Retrieve detailed document forensic report & OCR fields",
            responses: { "200": { description: "Full document record" } },
          },
        },
        "/api/v1/documents/{document_id}/action": {
          post: {
            summary: "Examiner action (Approve, Reject, Escalate, Comment)",
            responses: { "200": { description: "Updated document status" } },
          },
        },
        "/api/v1/stats": {
          get: {
            summary: "System-wide verification statistics & tamper vectors",
            responses: { "200": { description: "System Stats" } },
          },
        },
      },
    });
  });

  // Optional AI-powered live document analysis endpoint
  app.post("/api/v1/ai/analyze", async (req, res) => {
    try {
      const { documentTitle, documentType, institution, studentName, extractedText, imageBase64 } = req.body;
      const client = getGeminiClient();

      if (!client) {
        return res.json({
          usedGemini: false,
          note: "Server-side Gemini API key not provided; returning rule-based analysis.",
        });
      }

      const prompt = `You are a Senior Academic Document Forensic Examiner and Fraud Detection Specialist.
Analyze the following student document metadata and content:
- Document Title: ${documentTitle || "Academic Certificate"}
- Document Type: ${documentType || "Transcript"}
- Institution: ${institution || "University"}
- Student Name: ${studentName || "Candidate"}
- OCR Extracted Text: ${extractedText || "N/A"}

Perform a rigorous forensic evaluation and return a valid JSON object matching this schema:
{
  "authenticityScore": number (0-100),
  "verdict": "AUTHENTIC" | "SUSPICIOUS_TAMPERING" | "DEFINITIVE_FORGERY" | "REQUIRES_EXAMINATION",
  "riskLevel": "LOW RISK" | "MEDIUM RISK" | "HIGH RISK",
  "executiveSummary": "2-3 sentences concise professional verdict",
  "ocrFields": [
    { "fieldName": "string", "extractedValue": "string", "confidence": number (0-100), "status": "valid" | "warning" | "invalid" }
  ],
  "structuralSummary": "string describing template match, margin symmetry, and seal presence",
  "forensicSummary": "string describing ELA compression, font kerning consistency, and pixel tamper signs",
  "keyFindings": [
    { "type": "positive" | "negative" | "warning", "title": "string", "detail": "string" }
  ],
  "actionRecommendation": "string"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        usedGemini: true,
        data: parsed,
      });
    } catch (error: any) {
      console.error("AI Analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI analysis" });
    }
  });

  // --- Auth endpoints ---
  app.post("/api/v1/auth/login", (req, res) => {
    const { username, email, password, role } = req.body || {};
    const loginEmail = (email || username || "").trim().toLowerCase();

    if (!loginEmail || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    if (password.length < 4) {
      return res.status(400).json({ detail: "Password must be at least 4 characters" });
    }

    const assignedRole = role || (loginEmail.includes("admin") ? "admin" : "student");

    const mockName = loginEmail.includes(".")
      ? loginEmail.split("@")[0].split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
      : assignedRole === "admin"
      ? "Verification Administrator"
      : "Aarav Sharma";

    const user = {
      id: `usr-${assignedRole}-${Date.now()}`,
      name: mockName,
      email: loginEmail,
      role: assignedRole,
      studentId: assignedRole === "student" ? "2025-XII-88421" : undefined,
      institution: assignedRole === "admin" ? "National Credential Verification Authority" : "Central Board of Secondary Education (CBSE)",
    };

    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      })
    ).toString("base64")}.simulatedSignature`;

    res.json({
      access_token: token,
      token_type: "bearer",
      user,
    });
  });

  // --- Dynamic Project ZIP Export Endpoint ---
  app.get("/api/export-project-zip", (req, res) => {
    try {
      const publicZipPath = path.join(process.cwd(), "public", "veridoc-ai-source-code.zip");
      
      // Ensure zip is up to date
      const script = `python3 -c "import zipfile, os
output_zip = 'public/veridoc-ai-source-code.zip'
os.makedirs('public', exist_ok=True)
excluded_dirs = {'node_modules', 'dist', '.git', '.aistudio', '.cache'}
excluded_files = {'veridoc-ai-source-code.zip'}
with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.startswith('.')]
        for file in files:
            if file in excluded_files or (file.startswith('.') and file not in ['.env.example']):
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, '.')
            zipf.write(file_path, arcname)
"`;
      try {
        execSync(script, { timeout: 10000 });
      } catch (err) {
        console.warn("Python zip generation skipped, serving existing zip if present:", err);
      }

      if (fs.existsSync(publicZipPath)) {
        res.setHeader("Content-Disposition", 'attachment; filename="veridoc-ai-source-code.zip"');
        res.setHeader("Content-Type", "application/zip");
        const fileStream = fs.createReadStream(publicZipPath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ error: "Source code archive could not be generated." });
      }
    } catch (err: any) {
      console.error("ZIP Export error:", err);
      res.status(500).json({ error: err.message || "Failed to generate ZIP archive." });
    }
  });

  // --- Vite Middleware setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Verification Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
