from typing import Any, List
import shutil
import os
import time as _time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import case as case_schemas
from app.services.complaint import complaint as complaint_service
from app.api.deps import get_current_user
from app.models.complaint import Complaint as ComplaintModel

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "complaints")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/stats", response_model=case_schemas.ComplaintStats)
def read_complaint_stats(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Get statistics filtered by role."""
    from app.models.case import Case, CaseStatus
    from app.models.complaint import Complaint
    from app.models.user import UserRole
    
    query = db.query(Complaint).join(Case)
    
    # Filter by CMT if applicable
    if current_user.role == UserRole.COMPLAINT_OFFICER:
        query = query.filter(Complaint.registered_by_id == current_user.id)
    
    unassigned = query.filter(Case.status == CaseStatus.REGISTERED).count()
    active = query.filter(Case.status.in_([CaseStatus.ASSIGNED, CaseStatus.UNDER_ENQUIRY])).count()
    pending = query.filter(
        Case.status.in_([
            CaseStatus.ALLEGATION_PROVED,
            CaseStatus.MINOR_PROPOSED_PUNISHMENT,
            CaseStatus.CHARGE_MEMO_ISSUED,
            CaseStatus.DISCIPLINARY_ORDER_PENDING
        ])
    ).count()
    
    return {
        "unassigned": unassigned,
        "active": active,
        "pending": pending
    }


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Upload a supporting document. Returns the saved file path."""
    try:
        safe_name = file.filename.replace(" ", "_").replace("/", "_")
        unique_name = f"{int(_time.time())}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        # Return relative path for frontend access
        relative_path = os.path.join("uploads", "complaints", unique_name)
        return {"document_path": relative_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[case_schemas.Complaint])
def read_complaints(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 200,
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Retrieve complaints with strict role-based isolation."""
    from app.models.user import UserRole
    from app.models.employee import Employee
    from app.models.complaint import Complaint, ComplaintEmployee

    # COMPLAINT_OFFICER: see ONLY their own registrations (strict AND filter)
    if current_user.role == UserRole.COMPLAINT_OFFICER:
        return (
            db.query(Complaint)
            .filter(Complaint.registered_by_id == current_user.id)
            .order_by(Complaint.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # EMPLOYEE: only complaints they are tagged on or where they are the complainant
    if current_user.role == UserRole.EMPLOYEE:
        from sqlalchemy import or_
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            return []
        return (
            db.query(Complaint)
            .outerjoin(ComplaintEmployee, Complaint.id == ComplaintEmployee.complaint_id)
            .filter(or_(
                Complaint.complainant_employee_id == emp.id,
                ComplaintEmployee.employee_id == emp.id
            ))
            .order_by(Complaint.created_at.desc())
            .distinct()
            .offset(skip)
            .limit(limit)
            .all()
        )

    # CMD and other privileged roles see everything
    return (
        db.query(Complaint)
        .order_by(Complaint.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{complaint_id}", response_model=case_schemas.Complaint)
def read_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Get a single complaint by DB id."""
    obj = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return obj


@router.post("/", response_model=case_schemas.Complaint)
def create_complaint(
    *,
    db: Session = Depends(get_db),
    complaint_in: case_schemas.ComplaintCreate,
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Register a new complaint."""
    complaint_in.registered_by_id = current_user.id
    return complaint_service.create(db=db, obj_in=complaint_in)
