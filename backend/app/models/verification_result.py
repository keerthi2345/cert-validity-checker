from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False
    )

    ocr_result = Column(Text, nullable=True)
    structural_result = Column(Text, nullable=True)
    forensic_result = Column(Text, nullable=True)

    authenticity_score = Column(Float, nullable=True)

    final_status = Column(
        String(30),
        nullable=True
    )

    explanation = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )