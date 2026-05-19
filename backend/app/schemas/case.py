from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
from app.models.complaint import ComplaintType, ComplaintMode, ComplaintCategory
from app.models.case import CaseStatus, Gravity, WingType

# Complaint Schemas
class ComplaintBase(BaseModel):
    complaint_title: str
    details: str
    complaint_type: ComplaintType = ComplaintType.SERVICE
    complaint_mode: ComplaintMode = ComplaintMode.LETTER
    complaint_category: ComplaintCategory = ComplaintCategory.MISCONDUCT
    department: Optional[str] = None
    date_of_receipt: Optional[date] = None
    complainant_name: Optional[str] = None
    complainant_type: Optional[str] = None
    complainant_employee_id: Optional[int] = None

class ComplaintCreate(ComplaintBase):
    registered_by_id: int
    circle_id: Optional[int] = None
    employee_ids: List[int] = []
    document_path: Optional[str] = None

from app.schemas.employee import Employee

class EmployeeAssociation(BaseModel):
    employee: Optional[Employee] = None
    
    class Config:
        from_attributes = True

class Complaint(ComplaintBase):
    id: int
    complaint_id: str
    file_number: str
    registered_by_id: int
    department: Optional[str] = None
    date_of_receipt: Optional[date] = None
    document_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    status: Optional[CaseStatus] = None # Pulls from model property
    complainant_employee_id: Optional[int] = None
    case_id: Optional[int] = None
    case: Optional["Case"] = None
    
    # Use the 'employees' relationship from the model
    employees: List[EmployeeAssociation] = []

    class Config:
        from_attributes = True

class ComplaintInCase(ComplaintBase):
    id: int
    complaint_id: str
    file_number: str
    registered_by_id: int
    department: Optional[str] = None
    date_of_receipt: Optional[date] = None
    document_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    status: Optional[CaseStatus] = None 
    complainant_employee_id: Optional[int] = None
    case_id: Optional[int] = None
    # 'case' field removed to prevent recursion
    employees: List[EmployeeAssociation] = []

    class Config:
        from_attributes = True

class ComplaintStats(BaseModel):
    total: int
    unassigned: int
    active: int
    pending: int

# Case Schemas
class CaseBase(BaseModel):
    gravity: Gravity = Gravity.MINOR

class CaseCreate(CaseBase):
    complaint_id: int

class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    gravity: Optional[Gravity] = None

class CaseAssign(BaseModel):
    enquiry_officer_id: int
    enquiry_deadline: Optional[date] = None
    gravity: Optional[Gravity] = None
    assigned_wing: Optional[WingType] = None
    wing_details: Optional[str] = None
    disciplinary_authority_id: Optional[int] = None
    controlling_officer_id: Optional[int] = None

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
    enquiry_officer_id: Optional[int] = None
    enquiry_deadline: Optional[date] = None
    enquiry_report_path: Optional[str] = None
    assigned_wing: Optional[WingType] = None
    wing_details: Optional[str] = None
    controlling_officer_id: Optional[int] = None
    show_cause_served_date: Optional[date] = None
    show_cause_proof_path: Optional[str] = None
    employee_explanation_path: Optional[str] = None
    reminder_proof_path: Optional[str] = None
    final_order_proof_path: Optional[str] = None
    monthly_undertaking_path: Optional[str] = None
    appeal_path: Optional[str] = None
    disciplinary_authority_id: Optional[int] = None
    window_start_date: Optional[datetime] = None
    cc_modified_details: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    history: List[CaseHistory] = []
    complaint: Optional[ComplaintInCase] = None

    class Config:
        from_attributes = True

class CaseEnquiryAction(BaseModel):
    verdict: str  # "PROVED" or "NOT_PROVED"
    gravity: Optional[Gravity] = None
    comments: Optional[str] = None
    enquiry_report_path: Optional[str] = None

    class Config:
        from_attributes = True

class CaseCOAction(BaseModel):
    action_type: str
    served_date: date
    proof_path: Optional[str] = None
    explanation_path: Optional[str] = None
    monthly_undertaking_path: Optional[str] = None

class CaseEmployeeResponse(BaseModel):
    action_type: str # "EXPLANATION" or "APPEAL"
    document_path: str

class CaseDAAction(BaseModel):
    action_type: str
    comments: Optional[str] = None

class CaseCCAction(BaseModel):
    verdict: str # "CONCUR" or "MODIFY"
    modified_punishment: Optional[str] = None
    comments: Optional[str] = None

class CaseCMDSettle(BaseModel):
    comments: Optional[str] = None
    final_punishment_details: Optional[str] = None

Complaint.model_rebuild()
