from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    student_number = Column(
        String(50),
        unique=True,
        nullable=False
    )

    institution = Column(String(150), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )