from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, ComplaintEmployee
from app.models.case import Case, CaseStatus, CaseHistory
from app.models.notification import Notification
from app.schemas.case import ComplaintCreate


def _get_cmd_user_ids(db: Session) -> List[int]:
    """Return a list of user IDs with the CMD role."""
    from app.models.user import User, UserRole
    return [u.id for u in db.query(User).filter(User.role == UserRole.CMD).all()]


class CRUDComplaint:
    def create(self, db: Session, *, obj_in: ComplaintCreate) -> Complaint:
        # Generate Unique File Number: DC/YYYY/000X
        current_year = datetime.now().year
        count_this_year = db.query(Complaint).filter(
            Complaint.file_number.like(f"DC/{current_year}/%")
        ).count()
        new_seq = count_this_year + 1
        file_number = f"DC/{current_year}/{new_seq:04d}"
        complaint_id_str = f"COMP-{current_year}-{new_seq:04d}"

        db_obj = Complaint(
            complaint_id=complaint_id_str,
            file_number=file_number,
            complaint_title=obj_in.complaint_title,
            details=obj_in.details,
            complaint_type=obj_in.complaint_type,
            complaint_mode=obj_in.complaint_mode,
            complaint_category=obj_in.complaint_category,
            department=obj_in.department,
            date_of_receipt=obj_in.date_of_receipt or datetime.now().date(),
            registered_by_id=obj_in.registered_by_id,
            circle_id=obj_in.circle_id,
            document_path=obj_in.document_path,
            complainant_name=obj_in.complainant_name,
            complainant_type=obj_in.complainant_type,
        )
        db.add(db_obj)
        db.flush()  # Get ID for tagging

        # Tag employees to complaint (only if they exist to avoid FK errors)
        from app.models.employee import Employee as EmpModel
        for emp_id in obj_in.employee_ids:
            # Check by primary key OR by employee_id string
            emp_exists = db.query(EmpModel).filter(
                (EmpModel.id == emp_id) | (EmpModel.employee_id == str(emp_id))
            ).first()
            if emp_exists:
                db.add(ComplaintEmployee(complaint_id=db_obj.id, employee_id=emp_exists.id))

        # Auto-create Case with REGISTERED status
        # Explicitly link via relationship for atomicity
        new_case = Case(status=CaseStatus.REGISTERED)
        new_case.complaint = db_obj
        db.add(new_case)
        db.flush()

        # Log case history
        db.add(
            CaseHistory(
                case_id=new_case.id,
                from_status=CaseStatus.REGISTERED,
                to_status=CaseStatus.REGISTERED,
                action_by_id=obj_in.registered_by_id,
                comments="Case initialized with complaint registration.",
            )
        )

        # Notify all CMD users
        for cmd_id in _get_cmd_user_ids(db):
            db.add(
                Notification(
                    recipient_id=cmd_id,
                    title="New Complaint Registered",
                    message=(
                        f"File No. {file_number} — \"{obj_in.complaint_title}\" "
                        f"has been registered and awaits your review."
                    ),
                    link=f"/complaints/cmd/{db_obj.id}",
                )
            )

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        registered_by_id: Optional[int] = None,
        tagged_employee_id: Optional[int] = None,
        complainant_employee_id: Optional[int] = None,
    ) -> List[Complaint]:
        from sqlalchemy import or_

        query = db.query(Complaint)
        
        # 1. Strict Ownership Filter (AND)
        if registered_by_id:
            query = query.filter(Complaint.registered_by_id == registered_by_id)
        
        # 2. Role-based Visibility Filters (OR for Employee context)
        emp_filters = []
        if complainant_employee_id:
            emp_filters.append(Complaint.complainant_employee_id == complainant_employee_id)

        if tagged_employee_id:
            query = query.outerjoin(ComplaintEmployee)
            emp_filters.append(ComplaintEmployee.employee_id == tagged_employee_id)

        if emp_filters:
            query = query.filter(or_(*emp_filters))

        return (
            query.order_by(Complaint.created_at.desc())
            .distinct()
            .offset(skip)
            .limit(limit)
            .all()
        )


complaint = CRUDComplaint()
