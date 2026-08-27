from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.document import Document
from app.models.student import Student
from app.models.user import User
from app.models.verification_result import VerificationResult


router = APIRouter(
    prefix="/api/v1/results",
    tags=["Results"]
)


@router.get("/{document_id}")
def get_document_result(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("student", "admin", "verifier")
    )
):
    document = (
        db.query(Document)
        .filter(Document.document_uid == document_id)
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Student can only view own document result
    if current_user.role == "student":
        student = (
            db.query(Student)
            .filter(Student.user_id == current_user.id)
            .first()
        )

        if student is None or document.student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this result"
            )

    result = (
        db.query(VerificationResult)
        .filter(VerificationResult.document_id == document.id)
        .order_by(VerificationResult.created_at.desc())
        .first()
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification result not available yet"
        )

    return {
        "document_id": document.document_uid,
        "file_name": document.file_name,
        "document_status": document.status,
        "authenticity_score": result.authenticity_score,
        "final_status": result.final_status,
        "ocr_result": result.ocr_result,
        "structural_result": result.structural_result,
        "forensic_result": result.forensic_result,
        "explanation": result.explanation,
        "created_at": result.created_at
    }