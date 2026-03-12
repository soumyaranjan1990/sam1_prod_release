from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
from app.models.complaint import ComplaintType, ComplaintMode, ComplaintCategory
from app.models.case import CaseStatus, Gravity

# Complaint Schemas
class ComplaintBase(BaseModel):
    complaint_title: str
    details: str
    complaint_type: ComplaintType = ComplaintType.SERVICE
    complaint_mode: ComplaintMode = ComplaintMode.LETTER
    complaint_category: ComplaintCategory = ComplaintCategory.MISCONDUCT
    department: Optional[str] = None
    date_of_receipt: Optional[date] = None

class ComplaintCreate(ComplaintBase):
    registered_by_id: int
    circle_id: Optional[int] = None
    employee_ids: List[int] = []

class Complaint(ComplaintBase):
    id: int
    complaint_id: str
    file_number: str
    created_at: datetime

    class Config:
        from_attributes = True

# Case Schemas
class CaseBase(BaseModel):
    gravity: Gravity = Gravity.MINOR

class CaseCreate(CaseBase):
    complaint_id: int

class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    gravity: Optional[Gravity] = None

class CaseHistory(BaseModel):
    id: int
    from_status: CaseStatus
    to_status: CaseStatus
    action_by_id: Optional[int]
    comments: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class Case(CaseBase):
    id: int
    complaint_id: int
    status: CaseStatus
    created_at: datetime
    updated_at: Optional[datetime]
    history: List[CaseHistory] = []

    class Config:
        from_attributes = True
