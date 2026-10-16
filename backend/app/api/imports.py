import hashlib
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..collectors.file_importer import parse_csv_or_json_content
from ..config import settings
from ..db.database import get_db
from ..db.models import AuditLogModel, ImportModel
from ..services.event_service import ingest_event_batch

router = APIRouter(prefix="/imports", tags=["Imports"])


@router.post("")
async def upload_import_file(
    file: UploadFile = File(...),
    source_type: str = Form("file_import"),
    db: Session = Depends(get_db),
):
    content = await file.read()

    # Size check
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail={
                "error": {
                    "code": "PAYLOAD_TOO_LARGE",
                    "message": f"Uploaded file exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.",
                }
            },
        )

    file_hash = hashlib.sha256(content).hexdigest()

    # Parse and validate
    valid_records, error_records = parse_csv_or_json_content(
        content_bytes=content,
        filename=file.filename or "upload.csv",
        source_id="src-file-import-1",
    )

    accepted, rejected, duplicates = 0, len(error_records), 0
    if valid_records:
        acc, rej, dups = ingest_event_batch(db, valid_records)
        accepted += acc
        rejected += rej
        duplicates += dups

    # Record in imports table
    import_entry = ImportModel(
        source_name=file.filename or "uploaded_file",
        file_hash=file_hash,
        status="completed" if rejected == 0 else "partial",
        accepted_count=accepted,
        rejected_count=rejected,
        duplicate_count=duplicates,
        errors_json=json.dumps(error_records[:50]),  # store up to 50 errors
    )
    db.add(import_entry)

    # Audit log - record after commit so import_entry.id exists
    db.commit()

    audit_log = AuditLogModel(
        user_id="admin@local",
        action="FILE_IMPORT",
        resource_type="import",
        resource_id=import_entry.id,
        metadata_json=json.dumps(
            {
                "filename": file.filename,
                "accepted": accepted,
                "rejected": rejected,
                "duplicates": duplicates,
            }
        ),
    )
    db.add(audit_log)

    db.commit()

    return {
        "import_id": import_entry.id,
        "accepted": accepted,
        "rejected": rejected,
        "duplicates": duplicates,
        "errors": error_records[:50],
    }
