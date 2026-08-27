# VeriDoc AI — Person 2 Backend README

## Overview

This repository contains the VeriDoc AI frontend and the backend implementation completed for **Person 2 — Backend API, Database & Orchestration**.

Person 2 work includes:

* FastAPI backend setup
* PostgreSQL database integration
* User authentication
* JWT token generation and verification
* Role-based access control
* Student profile creation
* Document upload and secure storage
* Student document history
* Document status API
* Admin/Verifier review queue
* Approve/Reject flow
* Audit logging
* Verification result API
* Redis setup
* Celery background task setup
* Swagger API documentation

---

# Backend Project Structure

```text
backend/
│
├── app/
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   └── security.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── document.py
│   │   ├── verification_result.py
│   │   └── audit_log.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── documents.py
│   │   ├── review.py
│   │   └── results.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── review.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── storage.py
│   │
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   └── tasks.py
│   │
│   ├── database.py
│   └── main.py
│
├── uploads/
├── requirements.txt
└── .env
```

---

# 1. FastAPI Backend

The backend is built using FastAPI.

Run from the `backend` folder:

```bash
uvicorn app.main:app --reload
```

Default backend URL:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Swagger is used to test all backend APIs.

---

# 2. PostgreSQL Database

Database used during development:

```text
veridoc_db
```

Person 2 created the following required tables:

```text
users
students
documents
verification_results
audit_log
```

## users

Stores application users.

Main fields:

```text
id
name
email
password_hash
role
created_at
```

Supported roles:

```text
student
admin
verifier
```

## students

Stores student profile details.

Main fields:

```text
id
user_id
student_number
institution
created_at
```

When a user registers with the `student` role, a student profile is automatically created.

## documents

Stores uploaded document details.

Main fields:

```text
id
student_id
document_uid
file_name
file_path
file_type
status
uploaded_at
```

Possible statuses:

```text
Pending
Valid
Suspicious
Rejected
```

## verification_results

Stores verification output.

Main fields:

```text
id
document_id
ocr_result
structural_result
forensic_result
authenticity_score
final_status
explanation
created_at
```

## audit_log

Stores Admin/Verifier review activity.

Main fields:

```text
id
user_id
document_id
action
comments
created_at
```

---

# 3. Database Connection

Database configuration is handled in:

```text
backend/app/database.py
```

The PostgreSQL connection URL is loaded from:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/veridoc_db
SECRET_KEY=YOUR_SECRET_KEY
```

Do not commit the real `.env` file.

---

# 4. Authentication

Authentication is implemented using JWT.

Available authentication endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Passwords are hashed before storing them in PostgreSQL.

JWT tokens contain information such as:

```text
user id
email
role
expiry time
```

---

# 5. Role-Based Access Control

Backend permission checks are implemented for:

```text
student
admin
verifier
```

Examples:

Student can:

```text
Upload documents
View own documents
Check own document status
View own results
```

Admin/Verifier can:

```text
View review queue
Approve documents
Reject documents
Add review comments
```

A student attempting to access an Admin/Verifier endpoint receives:

```text
403 Forbidden
```

---

# 6. Student Registration

Endpoint:

```text
POST /api/v1/auth/register
```

Example request:

```json
{
  "name": "Test Student",
  "email": "student@test.com",
  "password": "student123",
  "role": "student"
}
```

When the role is `student`, a corresponding row is automatically inserted into the `students` table.

A unique student number is generated automatically.

Example:

```text
STU-456922E9
```

---

# 7. Login

Endpoint:

```text
POST /api/v1/auth/login
```

Example:

```json
{
  "email": "student@test.com",
  "password": "student123"
}
```

Example response:

```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer"
}
```

The JWT token must be used for protected endpoints.

---

# 8. Current User API

Endpoint:

```text
GET /api/v1/auth/me
```

Returns the currently authenticated user.

Example:

```json
{
  "id": 1,
  "name": "Test Student",
  "email": "student@test.com",
  "role": "student"
}
```

---

# 9. Document Upload

Endpoint:

```text
POST /api/v1/documents/upload
```

Only authenticated students can upload.

Supported formats:

```text
PDF
JPG
JPEG
PNG
```

Maximum file size:

```text
10 MB
```

Uploaded files are stored inside:

```text
backend/uploads/
```

The original filename is not used directly for disk storage.

A UUID-based filename is generated.

Example:

```text
uploads/ac69886fd3a845ec96f6f67ac40d2922.jpg
```

A public document identifier is also generated.

Example:

```text
DOC-AFDC5813548C
```

New documents start with:

```text
Pending
```

Example response:

```json
{
  "document_id": "DOC-AFDC5813548C",
  "file_name": "certificate.jpg",
  "status": "Pending",
  "message": "Document uploaded successfully"
}
```

---

# 10. Student Upload History

Endpoint:

```text
GET /api/v1/documents/my-documents
```

Returns all documents uploaded by the logged-in student.

Example:

```json
[
  {
    "document_id": "DOC-AFDC5813548C",
    "file_name": "certificate.jpg",
    "file_type": "image/jpeg",
    "status": "Pending",
    "uploaded_at": "..."
  }
]
```

Documents are returned newest first.

---

# 11. Document Status

Endpoint:

```text
GET /api/v1/documents/status/{document_id}
```

Example response:

```json
{
  "document_id": "DOC-AFDC5813548C",
  "file_name": "certificate.jpg",
  "status": "Pending",
  "uploaded_at": "..."
}
```

A student can only access documents belonging to their own profile.

---

# 12. Admin / Verifier Review Queue

Endpoint:

```text
GET /api/v1/review/queue
```

Allowed roles:

```text
admin
verifier
```

The review queue currently returns documents with these statuses:

```text
Pending
Suspicious
```

Example response:

```json
[
  {
    "document_id": "DOC-1AC2BB53E2F3",
    "file_name": "certificate.pdf",
    "file_type": "application/pdf",
    "status": "Pending",
    "student_id": 1,
    "student_number": "STU-456922E9",
    "uploaded_at": "..."
  }
]
```

---

# 13. Document Review

Endpoint:

```text
POST /api/v1/review/{document_id}
```

Allowed roles:

```text
admin
verifier
```

Approve request:

```json
{
  "decision": "approve",
  "comments": "Document verified successfully."
}
```

Approve changes status to:

```text
Valid
```

Reject request:

```json
{
  "decision": "reject",
  "comments": "Document contains suspicious information."
}
```

Reject changes status to:

```text
Rejected
```

Example approve response:

```json
{
  "document_id": "DOC-1AC2BB53E2F3",
  "status": "Valid",
  "reviewed_by": "verifier@test.com",
  "reviewer_role": "verifier",
  "comments": "Document verified successfully.",
  "message": "Document review completed"
}
```

---

# 14. Audit Logging

Whenever an Admin or Verifier reviews a document, an entry is created in:

```text
audit_log
```

Example:

```text
user_id      = 3
document_id  = 1
action       = APPROVED_DOCUMENT
comments     = Document verified successfully.
created_at   = timestamp
```

This provides review history and traceability.

---

# 15. Verification Result API

Endpoint:

```text
GET /api/v1/results/{document_id}
```

This endpoint can be used by:

```text
student
admin
verifier
```

Students are restricted to their own documents.

Example response:

```json
{
  "document_id": "DOC-1AC2BB53E2F3",
  "file_name": "certificate.pdf",
  "document_status": "Valid",
  "authenticity_score": 95,
  "final_status": "Valid",
  "ocr_result": "PASS",
  "structural_result": "PASS",
  "forensic_result": "PASS",
  "explanation": "Document passed verification checks.",
  "created_at": "..."
}
```

---

# 16. Redis

Redis is used as the message broker for Celery.

Development Redis URL:

```text
redis://localhost:6379/0
```

During Windows development Redis was installed using Ubuntu through WSL.

Start Redis:

```bash
sudo service redis-server start
```

Check Redis:

```bash
redis-cli ping
```

Expected output:

```text
PONG
```

---

# 17. Celery Background Processing

Celery is configured in:

```text
backend/app/workers/celery_app.py
```

Worker tasks are located in:

```text
backend/app/workers/tasks.py
```

Registered tasks currently include:

```text
app.workers.tasks.test_task
app.workers.tasks.process_document
```

Start the Celery worker on Windows:

```bash
celery -A app.workers.celery_app.celery_app worker --loglevel=info --pool=solo
```

Expected startup output includes:

```text
Connected to redis://localhost:6379/0

[tasks]
app.workers.tasks.process_document
app.workers.tasks.test_task
```

---

# 18. Upload → Celery Flow

After a successful document upload, FastAPI automatically triggers:

```python
process_document.delay(
    new_document.document_uid,
    new_document.file_path
)
```

Current flow:

```text
Student
   ↓
Upload document
   ↓
FastAPI
   ↓
File validation
   ↓
Secure file storage
   ↓
PostgreSQL document record
   ↓
Status = Pending
   ↓
Redis
   ↓
Celery
   ↓
process_document background task
```

The upload API does not wait for the background task before returning the upload response.

This makes document processing asynchronous.

---

# 19. Celery Test Confirmation

Celery was tested successfully.

Example test output:

```text
Task app.workers.tasks.test_task received
Task app.workers.tasks.test_task succeeded
```

Document processing task was also tested successfully.

Example:

```text
Task app.workers.tasks.process_document received
Task app.workers.tasks.process_document succeeded
```

---

# 20. Backend Installation

Open terminal inside:

```text
backend/
```

Create virtual environment:

```bash
python -m venv venv
```

Activate on Windows CMD:

```bash
venv\Scripts\activate.bat
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

---

# 21. Running the Backend Locally

For full backend operation, normally three processes are used.

## Terminal 1 — Redis

Inside Ubuntu / WSL:

```bash
sudo service redis-server start
```

Check:

```bash
redis-cli ping
```

Expected:

```text
PONG
```

## Terminal 2 — Celery

Inside Windows backend folder:

```bash
venv\Scripts\activate.bat
```

Then:

```bash
celery -A app.workers.celery_app.celery_app worker --loglevel=info --pool=solo
```

## Terminal 3 — FastAPI

Inside Windows backend folder:

```bash
venv\Scripts\activate.bat
```

Then:

```bash
uvicorn app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# 22. Git Security

The following files/folders are ignored by Git:

```text
.env
backend/.env
backend/venv/
backend/uploads/
venv/
uploads/
__pycache__/
node_modules/
dist/
```

Do not upload:

* PostgreSQL passwords
* JWT secret keys
* access tokens
* uploaded student documents
* Python virtual environments

---

# 23. Person 2 Completed Work Summary

Person 2 implementation currently includes:

* FastAPI project setup
* PostgreSQL database connection
* Required database models/tables
* File storage handling
* Unique document ID generation
* PDF/JPG/JPEG/PNG validation
* 10 MB file-size validation
* Student registration
* Automatic student profile creation
* Password hashing
* JWT login
* JWT verification
* Student/Admin/Verifier permissions
* Student document upload
* Student document history
* Document status API
* Admin/Verifier review queue
* Approve/Reject controls
* Review comments
* Audit logging
* Verification result retrieval
* Redis setup
* Celery setup
* Asynchronous document processing task trigger
* Swagger API documentation
* requirements.txt
* Git ignore/security configuration

---

# Current Backend Flow

```text
User Registration
      ↓
Login
      ↓
JWT Token
      ↓
Role Permission Check
      ↓
Student Upload
      ↓
File Validation
      ↓
File Storage
      ↓
PostgreSQL
      ↓
Status = Pending
      ↓
Redis
      ↓
Celery Background Task
      ↓
Verification Result Storage
      ↓
Student Result API
      ↓
Admin/Verifier Review
      ↓
Approve / Reject
      ↓
Audit Log
```

This completes the main Person 2 backend infrastructure for VeriDoc AI.
