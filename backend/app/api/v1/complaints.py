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
    
    total = query.count()
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
        "total": total,
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


@router.get("/")
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

    # 1. Fetch the raw list of complaints based on role
    if current_user.role == UserRole.COMPLAINT_OFFICER:
        from sqlalchemy.orm import joinedload
        complaints = (
            db.query(Complaint)
            .options(joinedload(Complaint.case))
            .filter(Complaint.registered_by_id == current_user.id)
            .order_by(Complaint.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    elif current_user.role == UserRole.EMPLOYEE:
        from sqlalchemy import or_
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            # Fallback if no employee profile: still allow seeing ones they REGISTERED
            complaints = (
                db.query(Complaint)
                .filter(Complaint.registered_by_id == current_user.id)
                .order_by(Complaint.created_at.desc())
                .offset(skip)
                .limit(limit)
                .all()
            )
        else:
            from sqlalchemy.orm import joinedload
            complaints = (
                db.query(Complaint)
                .options(joinedload(Complaint.case))
                .outerjoin(ComplaintEmployee, Complaint.id == ComplaintEmployee.complaint_id)
                .filter(or_(
                    Complaint.complainant_employee_id == emp.id,
                    ComplaintEmployee.employee_id == emp.id,
                    Complaint.registered_by_id == current_user.id
                ))
                .order_by(Complaint.created_at.desc())
                .distinct()
                .offset(skip)
                .limit(limit)
                .all()
            )
    else:
        # CMD and other privileged roles see everything
        from sqlalchemy.orm import joinedload
        complaints = (
            db.query(Complaint)
            .options(joinedload(Complaint.case))
            .order_by(Complaint.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    # 2. Universal Manual Serialization & Self-Healing
    from app.schemas import case as case_schemas
    from app.models.case import Case, CaseStatus
    results = []
    needs_commit = False
    
    for c in complaints:
        if not c.case:
            # On-the-fly repair for EVERY role
            new_case = Case(status=CaseStatus.REGISTERED)
            new_case.complaint = c
            db.add(new_case)
            needs_commit = True
            db.flush() 
            
        data = case_schemas.Complaint.model_validate(c).model_dump()
        data["case_id"] = c.case.id if c.case else None
        data["status"] = c.case.status if c.case else "REGISTERED"
        results.append(data)
        
    if needs_commit:
        db.commit()
    return results


@router.get("/{complaint_id}")
def read_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Get a single complaint by DB id."""
    from sqlalchemy.orm import joinedload
    from app.models.user import UserRole
    from app.models.employee import Employee
    from app.models.complaint import ComplaintEmployee
    from sqlalchemy import or_

    obj = db.query(ComplaintModel).options(joinedload(ComplaintModel.case)).filter(ComplaintModel.id == complaint_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Access Control Check
    if current_user.role == UserRole.COMPLAINT_OFFICER:
        if obj.registered_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
    
    elif current_user.role == UserRole.EMPLOYEE:
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        is_owner = obj.registered_by_id == current_user.id
        is_involved = False
        if emp:
            is_involved = (
                obj.complainant_employee_id == emp.id or 
                db.query(ComplaintEmployee).filter(
                    ComplaintEmployee.complaint_id == obj.id, 
                    ComplaintEmployee.employee_id == emp.id
                ).first() is not None
            )
        if not (is_owner or is_involved):
            raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
        
    data = case_schemas.Complaint.model_validate(obj).model_dump()
    data["case_id"] = obj.case.id if obj.case else None
    data["status"] = obj.case.status if obj.case else "REGISTERED"
    return data


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
