from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    document_uid = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="Pending"
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )