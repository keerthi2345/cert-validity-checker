import os
import uuid
from pathlib import Path
from app.models.verification_result import VerificationResult
from app.models.audit_log import AuditLog

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.document import Document
from app.models.student import Student
from app.models.user import User
from app.services.storage import save_upload_file
from app.workers.tasks import process_document


router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"]
)


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found"
        )

    file_path = save_upload_file(file)

    document_uid = f"DOC-{uuid.uuid4().hex[:12].upper()}"

    new_document = Document(
        student_id=student.id,
        document_uid=document_uid,
        file_name=os.path.basename(file.filename or "document"),
        file_path=file_path,
        file_type=file.content_type or "unknown",
        status="Pending"
    )

    try:
        db.add(new_document)
        db.commit()
        db.refresh(new_document)

    except Exception:
        db.rollback()

        if os.path.exists(file_path):
            os.remove(file_path)

        raise

    # Trigger Celery background processing
    process_document.delay(
        new_document.document_uid,
        new_document.file_path
    )

    return {
        "document_id": new_document.document_uid,
        "file_name": new_document.file_name,
        "status": new_document.status,
        "message": "Document uploaded successfully"
    }


@router.get("/my-documents")
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found"
        )

    documents = (
        db.query(Document)
        .filter(Document.student_id == student.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return [
        {
            "document_id": document.document_uid,
            "file_name": document.file_name,
            "file_type": document.file_type,
            "status": document.status,
            "uploaded_at": document.uploaded_at
        }
        for document in documents
    ]


@router.get("/status/{document_id}")
def get_document_status(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student profile not found"
        )

    document = (
        db.query(Document)
        .filter(
            Document.document_uid == document_id,
            Document.student_id == student.id
        )
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return {
        "document_id": document.document_uid,
        "file_name": document.file_name,
        "status": document.status,
        "uploaded_at": document.uploaded_at
    }

def _remove_document(db: Session, document: Document):
    file_path = document.file_path
    db.query(VerificationResult).filter(VerificationResult.document_id == document.id).delete()
    db.query(AuditLog).filter(AuditLog.document_id == document.id).delete()
    db.delete(document)
    db.commit()

    # remove files only after the database delete succeeded
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
    if file_path:
        stem = Path(file_path).resolve()
        temp_dir = stem.parent.parent / "temp_ocr_input"
        for extra in temp_dir.glob(f"{stem.stem}*"):
            try:
                extra.unlink()
            except OSError:
                pass


@router.delete("/{document_id}")
def delete_my_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student"))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile not found")

    document = (
        db.query(Document)
        .filter(Document.document_uid == document_id, Document.student_id == student.id)
        .first()
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    _remove_document(db, document)
    return {"document_id": document_id, "message": "Document deleted"}


@router.delete("/admin/{document_id}")
def delete_document_as_admin(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    document = db.query(Document).filter(Document.document_uid == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    _remove_document(db, document)
    return {"document_id": document_id, "message": "Document deleted"}