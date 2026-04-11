from typing import Any, List
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.case import CaseCreate, Case, CaseAssign, CaseEnquiryAction, CaseCOAction, CaseEmployeeResponse, CaseDAAction, CaseCCAction
from app.services.case import case as case_service
from app.models.case import Case as CaseModel, CaseStatus, CaseHistory, Gravity
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=Case)
def create_case(
    *,
    db: Session = Depends(get_db),
    case_in: CaseCreate,
) -> Any:
    """Create new case."""
    return case_service.create(db=db, obj_in=case_in)


@router.get("/", response_model=List[Case])
def read_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve cases with role-based filtering."""
    query = db.query(CaseModel)
    
    # Apply filtering based on role
    if current_user.role == UserRole.CMD:
        # CMD sees everything
        pass
    elif current_user.role == UserRole.ENQUIRY_OFFICER:
        query = query.filter(CaseModel.enquiry_officer_id == current_user.id)
    elif current_user.role == UserRole.COMPLAINT_OFFICER:
        # Join with Complaint to filter by registered_by_id
        from app.models.complaint import Complaint
        query = query.join(Complaint).filter(Complaint.registered_by_id == current_user.id)
    elif current_user.role == UserRole.DA:
        query = query.filter(CaseModel.disciplinary_authority_id == current_user.id)
    elif current_user.role == UserRole.CO:
        query = query.filter(CaseModel.controlling_officer_id == current_user.id)
    elif current_user.role in [UserRole.CIRCLE_HEAD, UserRole.GM]:
        # These roles might see more, but for now isolation as requested
        # If they aren't assigned to specific cases, they won't see much.
        pass
    
    return query.offset(skip).limit(limit).all()


@router.patch("/{case_id}/assign")
def assign_case(
    case_id: int,
    assignment: CaseAssign,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """
    CMD assigns an Enquiry Officer and timeline to a case.
    Sets case gravity and status to UNDER_ENQUIRY.
    Sends in-app notification to assigned Enquiry Officer.
    """
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    officer = db.query(User).filter(User.id == assignment.enquiry_officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Enquiry Officer not found")

    prev_status = case.status
    case.enquiry_officer_id = assignment.enquiry_officer_id
    case.enquiry_deadline = assignment.enquiry_deadline
    case.assigned_wing = assignment.assigned_wing
    case.wing_details = assignment.wing_details
    case.disciplinary_authority_id = assignment.disciplinary_authority_id
    case.controlling_officer_id = assignment.controlling_officer_id
    
    if assignment.gravity:
        case.gravity = assignment.gravity
    case.status = CaseStatus.ASSIGNED

    # Log history
    wing_info = f"Wing: {assignment.assigned_wing}"
    if assignment.wing_details:
        wing_info += f" ({assignment.wing_details})"
    
    db.add(CaseHistory(
        case_id=case.id,
        from_status=prev_status,
        to_status=CaseStatus.ASSIGNED,
        action_by_id=current_user.id,
        comments=f"Assigned to EO id={assignment.enquiry_officer_id}. {wing_info}. Deadline: {assignment.enquiry_deadline}.",
    ))

    # Notify the assigned Enquiry Officer
    complaint = case.complaint
    file_number = complaint.file_number if complaint else f"Case #{case_id}"
    db.add(Notification(
        recipient_id=assignment.enquiry_officer_id,
        title="Enquiry Assignment",
        message=(
            f"You have been assigned enquiry for File No. {file_number}."
            + (f" Deadline: {assignment.enquiry_deadline}." if assignment.enquiry_deadline else "")
        ),
        link=f"/enquiries/{case_id}",
    ))

    db.commit()
    db.refresh(case)
    return {
        "ok": True,
        "case_id": case.id,
        "status": case.status,
        "enquiry_officer_id": case.enquiry_officer_id,
        "enquiry_deadline": str(case.enquiry_deadline) if case.enquiry_deadline else None,
    }

@router.put("/{case_id}/enquiry-action")
def enquiry_action(
    case_id: int,
    action: CaseEnquiryAction,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """
    Enquiry Officer uploads report and sets verdict.
    If PROVED: status -> ALLEGATION_PROVED, gravity is set.
    If NOT_PROVED: status -> CLOSED_NOT_PROVED.
    """
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Only assigned EO can perform this action
    if case.enquiry_officer_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized. You are not the assigned Enquiry Officer for this case.")

    prev_status = case.status
    if action.verdict == "PROVED":
        case.status = CaseStatus.ALLEGATION_PROVED
        if action.gravity:
            case.gravity = action.gravity
    elif action.verdict == "NOT_PROVED":
        case.status = CaseStatus.CLOSED_NOT_PROVED
    else:
        raise HTTPException(status_code=400, detail="Invalid verdict. Must be 'PROVED' or 'NOT_PROVED'.")

    if action.enquiry_report_path:
        case.enquiry_report_path = action.enquiry_report_path

    # Log history
    db.add(CaseHistory(
        case_id=case.id,
        from_status=prev_status,
        to_status=case.status,
        action_by_id=current_user.id,
        comments=action.comments or f"Enquiry completed. Verdict: {action.verdict}.",
    ))

    # Notify CMD
    cmd_users = db.query(User).filter(User.role == UserRole.CMD).all()
    complaint = case.complaint
    file_number = complaint.file_number if complaint else f"Case #{case_id}"
    for cmd in cmd_users:
        db.add(Notification(
            recipient_id=cmd.id,
            title="Enquiry Completed",
            message=f"Enquiry for File No. {file_number} has been completed with verdict: {action.verdict}.",
            link=f"/cases/{case_id}",
        ))

    db.commit()
    db.refresh(case)
    return {
        "ok": True,
        "case_id": case.id,
        "status": case.status,
        "verdict": action.verdict,
    }

@router.put("/{case_id}/co-action")
def co_action(
    case_id: int,
    action: CaseCOAction,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Controlling Officer uploads proofs of service."""
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    prev_status = case.status
    case.controlling_officer_id = current_user.id
    
    if action.action_type == "SERVE_SHOW_CAUSE":
        case.show_cause_proof_path = action.proof_path
        case.show_cause_served_date = action.served_date
        case.status = CaseStatus.AWAITING_EMPLOYEE_RESPONSE
    elif action.action_type == "SERVE_REMINDER_1":
        case.reminder_proof_path = action.proof_path
        case.status = CaseStatus.REMINDER_1_SENT
    elif action.action_type == "SERVE_REMINDER_2":
        case.reminder_proof_path = action.proof_path
        case.status = CaseStatus.REMINDER_2_SENT
    elif action.action_type == "SERVE_FINAL_OPPORTUNITY":
        case.reminder_proof_path = action.proof_path
        case.status = CaseStatus.FINAL_OPPORTUNITY_SENT
    elif action.action_type == "SERVE_FINAL_ORDER":
        case.final_order_proof_path = action.proof_path
        case.status = CaseStatus.APPEAL_WINDOW_OPEN
    elif action.action_type == "MONTHLY_UNDERTAKING":
        case.monthly_undertaking_path = action.monthly_undertaking_path
    else:
        raise HTTPException(status_code=400, detail="Invalid action type.")

    db.add(CaseHistory(
        case_id=case.id,
        from_status=prev_status,
        to_status=case.status,
        action_by_id=current_user.id,
        comments=f"CO action: {action.action_type} served on {action.served_date}.",
    ))
    db.commit()
    return {"ok": True, "status": case.status}

@router.put("/{case_id}/employee-response")
def employee_response(
    case_id: int,
    response: CaseEmployeeResponse,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    prev_status = case.status
    if response.action_type == "EXPLANATION":
        case.employee_explanation_path = response.document_path
    elif response.action_type == "APPEAL":
        case.appeal_path = response.document_path
        case.status = CaseStatus.APPEAL_UNDER_REVIEW
    else:
        raise HTTPException(status_code=400, detail="Invalid action type.")

    db.add(CaseHistory(
        case_id=case.id,
        from_status=prev_status,
        to_status=case.status,
        action_by_id=current_user.id,
        comments=f"Employee submitted {response.action_type.lower()}.",
    ))
    db.commit()
    return {"ok": True, "status": case.status}

@router.put("/{case_id}/da-action")
def da_action(
    case_id: int,
    action: CaseDAAction,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_status = case.status
    if action.action_type == "ISSUE_SHOW_CAUSE":
        case.status = CaseStatus.SHOW_CAUSE_ISSUED
    elif action.action_type == "ISSUE_REMINDER_1":
        # Waiting for CO to serve, DA just records intent.
        pass
    elif action.action_type == "ISSUE_REMINDER_2":
        pass
    elif action.action_type == "ISSUE_FINAL_OPPORTUNITY":
        pass
    elif action.action_type == "ISSUE_EX_PARTE":
        case.status = CaseStatus.EX_PARTE_PROCEEDED
    elif action.action_type == "SEND_TO_CC":
        case.status = CaseStatus.UNDER_CONCURRENCE_REVIEW
    elif action.action_type == "ISSUE_FINAL_ORDER":
        case.status = CaseStatus.DISCIPLINARY_ORDER_PENDING
    else:
        raise HTTPException(status_code=400, detail="Invalid action type.")

    db.add(CaseHistory(
        case_id=case.id,
        from_status=prev_status,
        to_status=case.status,
        action_by_id=current_user.id,
        comments=action.comments or f"DA action: {action.action_type}.",
    ))
    db.commit()
    return {"ok": True, "status": case.status}

@router.put("/{case_id}/cc-action")
def cc_action(
    case_id: int,
    action: CaseCCAction,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prev_status = case.status
    if action.verdict == "CONCUR":
        case.status = CaseStatus.FINAL_ORDER_ISSUED_CONCURRED
    elif action.verdict == "MODIFY":
        case.status = CaseStatus.FINAL_ORDER_ISSUED_MODIFIED
    else:
        raise HTTPException(status_code=400, detail="Invalid verdict.")

    db.add(CaseHistory(
        case_id=case.id,
        from_status=prev_status,
        to_status=case.status,
        action_by_id=current_user.id,
        comments=action.comments or f"Concurrence Committee verdict: {action.verdict}. {action.modified_punishment or ''}",
    ))
    db.commit()
    return {"ok": True, "status": case.status}
