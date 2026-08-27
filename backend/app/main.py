from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine, Base
from app.models.user import User
from app.models.student import Student
from app.models.document import Document
from app.models.verification_result import VerificationResult
from app.models.audit_log import AuditLog
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.review import router as review_router
from app.routes.results import router as results_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="VeriDoc AI API",
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True
    }
)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(review_router)
app.include_router(results_router)


@app.get("/")
def home():
    return {
        "message": "VeriDoc AI Backend is running"
    }


@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "connected",
        "test_result": value
    }