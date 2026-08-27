import json

from app.database import SessionLocal
from app.models.document import Document
from app.models.verification_result import VerificationResult
from app.workers.celery_app import celery_app


@celery_app.task
def test_task():
    return {
        "message": "Celery is working"
    }


def calculate_final_status(
    logic_passed: bool,
    structural_score: float,
    forensic_score: float
):
    """
    Temporary aggregation rule.

    Person 4/team final scoring weights decide chesaka
    ee logic ni update cheyyachu.
    """

    logic_score = 100 if logic_passed else 0

    final_score = (
        logic_score * 0.30
        + structural_score * 0.20
        + forensic_score * 0.50
    )

    if final_score >= 80:
        final_status = "Valid"

    elif final_score >= 50:
        final_status = "Suspicious"

    else:
        final_status = "Rejected"

    return round(final_score, 2), final_status


@celery_app.task
def process_document(document_id: str, file_path: str):
    """
    Main VeriDoc background orchestration task.

    Flow:

    Upload
        ↓
    Celery
        ↓
    Person 3 OCR / document understanding
        ↓
    Person 4 structural + forensic analysis
        ↓
    Aggregation
        ↓
    verification_results table
        ↓
    documents.status update
    """

    db = SessionLocal()

    try:
        document = (
            db.query(Document)
            .filter(Document.document_uid == document_id)
            .first()
        )

        if document is None:
            return {
                "document_id": document_id,
                "pipeline_status": "failed",
                "error": "Document not found"
            }

        # -------------------------------------------------
        # PERSON 3 INTEGRATION HOOK
        # -------------------------------------------------
        #
        # Later Person 3 module ready ayyaka example:
        #
        # from app.integrations.person3 import run_ocr_pipeline
        # person3_result = run_ocr_pipeline(file_path)
        #
        # Expected:
        #
        # {
        #     "doc_type": "marksheet",
        #     "extracted_fields": {...},
        #     "logic_check_result": "PASS"
        # }
        #

        person3_result = None

        # -------------------------------------------------
        # PERSON 4 INTEGRATION HOOK
        # -------------------------------------------------
        #
        # Later Person 4 module ready ayyaka example:
        #
        # from app.integrations.person4 import run_forensics_pipeline
        # person4_result = run_forensics_pipeline(
        #     file_path,
        #     person3_result
        # )
        #
        # Expected:
        #
        # {
        #     "structural_score": 85,
        #     "forensics_score": 90,
        #     "forensic_result": {...},
        #     "explanation": "..."
        # }
        #

        person4_result = None

        # Person 3 / Person 4 actual pipelines inka
        # connect avvakapothe document Pending gane untundi.
        if person3_result is None or person4_result is None:
            return {
                "document_id": document_id,
                "file_path": file_path,
                "pipeline_status": "waiting_for_person3_person4"
            }

        # -------------------------------------------------
        # AGGREGATION
        # -------------------------------------------------

        logic_passed = (
            person3_result.get("logic_check_result") == "PASS"
        )

        structural_score = float(
            person4_result.get("structural_score", 0)
        )

        forensic_score = float(
            person4_result.get("forensics_score", 0)
        )

        final_score, final_status = calculate_final_status(
            logic_passed,
            structural_score,
            forensic_score
        )

        # -------------------------------------------------
        # SAVE VERIFICATION RESULT
        # -------------------------------------------------

        verification_result = VerificationResult(
            document_id=document.id,

            ocr_result=json.dumps(
                person3_result,
                ensure_ascii=False
            ),

            structural_result=json.dumps(
                {
                    "structural_score": structural_score
                },
                ensure_ascii=False
            ),

            forensic_result=json.dumps(
                person4_result,
                ensure_ascii=False
            ),

            authenticity_score=final_score,

            final_status=final_status,

            explanation=person4_result.get(
                "explanation",
                "Automated verification completed."
            )
        )

        db.add(verification_result)

        # Final document status update
        document.status = final_status

        db.commit()
        db.refresh(verification_result)

        return {
            "document_id": document_id,
            "pipeline_status": "completed",
            "authenticity_score": final_score,
            "final_status": final_status
        }

    except Exception as exc:
        db.rollback()

        return {
            "document_id": document_id,
            "pipeline_status": "failed",
            "error": str(exc)
        }

    finally:
        db.close()