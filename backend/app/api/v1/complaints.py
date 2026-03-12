from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.case import ComplaintCreate, Complaint
from app.services.complaint import complaint as complaint_service
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=Complaint)
def create_complaint(
    *,
    db: Session = Depends(get_db),
    complaint_in: ComplaintCreate,
    current_user: Any = Depends(get_current_user),
) -> Any:
    """
    Create new complaint.
    """
    # Overwrite registered_by_id with current user's ID for security
    complaint_in.registered_by_id = current_user.id
    complaint = complaint_service.create(db=db, obj_in=complaint_in)
    return complaint


@router.get("/", response_model=List[Complaint])
def read_complaints(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve complaints.
    """
    complaints = complaint_service.get_multi(db, skip=skip, limit=limit)
    return complaints
