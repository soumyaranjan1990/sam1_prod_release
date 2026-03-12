from sqlalchemy.orm import Session
from app.models.case import Case, CaseStatus, CaseHistory
from app.models.user import User, UserRole

class WorkflowError(Exception):
    pass

class WorkflowManager:
    """
    Service to handle Case state transitions and permission checks.
    Ported from Django implementation.
    """
    
    TRANSITIONS = {
        CaseStatus.REGISTERED: [CaseStatus.UNDER_ENQUIRY],
        CaseStatus.UNDER_ENQUIRY: [CaseStatus.ENQUIRY_COMPLETED],
        CaseStatus.ENQUIRY_COMPLETED: [CaseStatus.ALLEGATION_NOT_PROVED, CaseStatus.ALLEGATION_PROVED],
        CaseStatus.ALLEGATION_NOT_PROVED: [CaseStatus.CASE_CLOSED],
        CaseStatus.ALLEGATION_PROVED: [
            CaseStatus.MINOR_PROPOSED_PUNISHMENT,
            CaseStatus.CHARGE_MEMO_ISSUED
        ],
        CaseStatus.MINOR_PROPOSED_PUNISHMENT: [CaseStatus.MINOR_FINAL_ORDER_ISSUED],
        CaseStatus.MINOR_FINAL_ORDER_ISSUED: [CaseStatus.APPEAL_WINDOW_OPEN],
        CaseStatus.CHARGE_MEMO_ISSUED: [CaseStatus.SHOW_CAUSE_ISSUED],
        CaseStatus.SHOW_CAUSE_ISSUED: [CaseStatus.AWAITING_EMPLOYEE_RESPONSE],
        CaseStatus.AWAITING_EMPLOYEE_RESPONSE: [
            CaseStatus.REMINDER_1_SENT, 
            CaseStatus.DISCIPLINARY_ORDER_PENDING
        ],
        CaseStatus.REMINDER_1_SENT: [CaseStatus.REMINDER_2_SENT, CaseStatus.DISCIPLINARY_ORDER_PENDING],
        CaseStatus.REMINDER_2_SENT: [CaseStatus.FINAL_OPPORTUNITY_SENT, CaseStatus.DISCIPLINARY_ORDER_PENDING],
        CaseStatus.FINAL_OPPORTUNITY_SENT: [CaseStatus.EX_PARTE_PROCEEDED, CaseStatus.DISCIPLINARY_ORDER_PENDING],
        CaseStatus.EX_PARTE_PROCEEDED: [CaseStatus.DISCIPLINARY_ORDER_PENDING],
        CaseStatus.DISCIPLINARY_ORDER_PENDING: [
            CaseStatus.UNDER_CONCURRENCE_REVIEW, 
            CaseStatus.FINAL_ORDER_ISSUED_CONCURRED,
            CaseStatus.FINAL_ORDER_ISSUED_MODIFIED,
            CaseStatus.FINAL_ORDER_ISSUED_EX_PARTE
        ],
        CaseStatus.UNDER_CONCURRENCE_REVIEW: [
            CaseStatus.FINAL_ORDER_ISSUED_CONCURRED,
            CaseStatus.FINAL_ORDER_ISSUED_MODIFIED
        ],
        CaseStatus.FINAL_ORDER_ISSUED_CONCURRED: [CaseStatus.APPEAL_WINDOW_OPEN],
        CaseStatus.FINAL_ORDER_ISSUED_MODIFIED: [CaseStatus.APPEAL_WINDOW_OPEN],
        CaseStatus.FINAL_ORDER_ISSUED_EX_PARTE: [CaseStatus.APPEAL_WINDOW_OPEN],
        CaseStatus.APPEAL_WINDOW_OPEN: [CaseStatus.APPEAL_UNDER_REVIEW, CaseStatus.CASE_CLOSED],
        CaseStatus.APPEAL_UNDER_REVIEW: [CaseStatus.CASE_CLOSED],
    }

    ROLE_PERMISSIONS = {
        CaseStatus.REGISTERED: [UserRole.CMD],
        CaseStatus.UNDER_ENQUIRY: [UserRole.ENQUIRY_OFFICER],
        CaseStatus.ENQUIRY_COMPLETED: [UserRole.DA],
        CaseStatus.ALLEGATION_PROVED: [UserRole.DA],
        CaseStatus.MINOR_PROPOSED_PUNISHMENT: [UserRole.DA],
        CaseStatus.CHARGE_MEMO_ISSUED: [UserRole.DA],
        CaseStatus.SHOW_CAUSE_ISSUED: [UserRole.DA],
        CaseStatus.DISCIPLINARY_ORDER_PENDING: [UserRole.DA],
        CaseStatus.UNDER_CONCURRENCE_REVIEW: [UserRole.CONCURRENCE_COMMITTEE],
        CaseStatus.FINAL_ORDER_ISSUED_CONCURRED: [UserRole.DA],
        CaseStatus.FINAL_ORDER_ISSUED_MODIFIED: [UserRole.DA],
        CaseStatus.FINAL_ORDER_ISSUED_EX_PARTE: [UserRole.DA],
        CaseStatus.APPEAL_WINDOW_OPEN: [UserRole.APPEAL_AUTHORITY],
        CaseStatus.APPEAL_UNDER_REVIEW: [UserRole.APPEAL_AUTHORITY],
    }

    @classmethod
    def transition_to(cls, db: Session, case: Case, to_status: CaseStatus, user: User, comments: str = ""):
        from_status = case.status
        
        # Check if transition is valid
        if to_status not in cls.TRANSITIONS.get(from_status, []):
            raise WorkflowError(f"Invalid transition from {from_status} to {to_status}")

        # Permission check
        required_roles = cls.ROLE_PERMISSIONS.get(from_status, [])
        if required_roles and user.role not in required_roles and not user.is_superuser:
            raise WorkflowError(f"User with role {user.role} is not authorized for this transition.")

        # Perform transition
        case.status = to_status
        
        # Log history
        history = CaseHistory(
            case_id=case.id,
            from_status=from_status,
            to_status=to_status,
            action_by_id=user.id,
            comments=comments
        )
        db.add(history)
        db.commit()
        db.refresh(case)
        return case
