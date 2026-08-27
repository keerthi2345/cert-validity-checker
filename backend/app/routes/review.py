from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.student import Student
from app.models.user import User
from app.schemas.review import ReviewRequest


router = APIRouter(
    prefix="/api/v1/review",
    tags=["Review"]
)


@router.get("/queue")
def get_review_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin", "verifier")
    )
):
    documents = (
        db.query(Document)
        .filter(
            Document.status.in_(["Pending", "Suspicious"])
        )
        .order_by(Document.uploaded_at.asc())
        .all()
    )

    result = []

    for document in documents:
        student = (
            db.query(Student)
            .filter(Student.id == document.student_id)
            .first()
        )

        result.append({
            "document_id": document.document_uid,
            "file_name": document.file_name,
            "file_type": document.file_type,
            "status": document.status,
            "student_id": document.student_id,
            "student_number": (
                student.student_number
                if student
                else None
            ),
            "uploaded_at": document.uploaded_at
        })

    return result


@router.post("/{document_id}")
def review_document(
    document_id: str,
    review_data: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("admin", "verifier")
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

    if document.status not in ["Pending", "Suspicious"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has already been reviewed"
        )

    if review_data.decision == "approve":
        document.status = "Valid"
        action = "APPROVED_DOCUMENT"

    else:
        document.status = "Rejected"
        action = "REJECTED_DOCUMENT"

    audit_entry = AuditLog(
        user_id=current_user.id,
        document_id=document.id,
        action=action,
        comments=review_data.comments
    )

    try:
        db.add(audit_entry)
        db.commit()
        db.refresh(document)

    except Exception:
        db.rollback()
        raise

    return {
        "document_id": document.document_uid,
        "status": document.status,
        "reviewed_by": current_user.email,
        "reviewer_role": current_user.role,
        "comments": review_data.comments,
        "message": "Document review completed"
    }