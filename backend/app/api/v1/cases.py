from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.case import CaseCreate, Case
from app.services.case import case as case_service

router = APIRouter()

@router.post("/", response_model=Case)
def create_case(
    *,
    db: Session = Depends(get_db),
    case_in: CaseCreate,
) -> Any:
    """
    Create new case.
    """
    case = case_service.create(db=db, obj_in=case_in)
    return case

@router.get("/", response_model=List[Case])
def read_cases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve cases.
    """
    cases = case_service.get_multi(db, skip=skip, limit=limit)
    return cases
