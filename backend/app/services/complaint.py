from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, ComplaintEmployee
from app.schemas.case import ComplaintCreate
from datetime import datetime

class CRUDComplaint:
    def create(self, db: Session, *, obj_in: ComplaintCreate) -> Complaint:
        db_obj = Complaint(
            complaint_title=obj_in.complaint_title,
            details=obj_in.details,
            complaint_type=obj_in.complaint_type,
            complaint_mode=obj_in.complaint_mode,
            complaint_category=obj_in.complaint_category,
            department=obj_in.department,
            date_of_receipt=obj_in.date_of_receipt or datetime.now().date(),
            registered_by_id=obj_in.registered_by_id,
            circle_id=obj_in.circle_id
        )
        db.add(db_obj)
        db.flush() # To get ID for tagging
        
        # Add tagged employees
        for emp_id in obj_in.employee_ids:
            tag = ComplaintEmployee(complaint_id=db_obj.id, employee_id=emp_id)
            db.add(tag)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Complaint]:
        return db.query(Complaint).offset(skip).limit(limit).all()

complaint = CRUDComplaint()
