import random
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.security import settings
from app.db.session import get_db
from app.schemas.user import Token, User, SignUpRequest, ForgotPasswordRequest, PasswordResetRequest
from app.services.user import user as user_service
from app.api.deps import get_current_user
from app.models.user import OTP, OTPPurpose
from app.models.employee import Employee

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, retrieve an access token for future requests
    """
    user = user_service.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=User)
def signup(
    *,
    db: Session = Depends(get_db),
    user_in: SignUpRequest
) -> Any:
    """
    Create new user and employee profile.
    """
    # Check if Employee record exists
    existing_employee = db.query(Employee).filter(Employee.employee_id == user_in.employee_id).first()
    if existing_employee and existing_employee.user_id:
        raise HTTPException(
            status_code=400,
            detail="Employee ID already linked to another account."
        )

    # Determine role based on designation if it exists
    from app.models.user import UserRole
    user_role = UserRole.EMPLOYEE

    if existing_employee and existing_employee.designation:
        title = existing_employee.designation.title.upper()
        if "CMD" in title:
            user_role = UserRole.CMD
        elif "ENQUIRY OFFICER" in title or "EO" in title:
            user_role = UserRole.ENQUIRY_OFFICER
        elif "COMPLAINT OFFICER" in title or "CMT" in title:
            user_role = UserRole.COMPLAINT_OFFICER
        elif "DISCIPLINARY AUTHORITY" in title or "DA" in title:
            user_role = UserRole.DA
        elif "CONTROLLING OFFICER" in title or "CO" in title:
            user_role = UserRole.CO
        elif "CIRCLE HEAD" in title:
            user_role = UserRole.CIRCLE_HEAD
        elif "GM" in title or "GENERAL MANAGER" in title:
            user_role = UserRole.GM
        elif "CONCURRENCE" in title:
            user_role = UserRole.CONCURRENCE_COMMITTEE
        elif "APPEAL" in title:
            user_role = UserRole.APPEAL_AUTHORITY

    # Create User
    from app.models.user import User as UserModel
    from app.core.security import get_password_hash
    
    db_user = UserModel(
        username=user_in.employee_id,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        phone_number=user_in.phone_number,
        role=user_role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    if existing_employee:
        # Link existing employee record
        existing_employee.user_id = db_user.id
        db.add(existing_employee)
        db.commit()
    else:
        # Create New Employee Profile (defaults to EMPLOYEE role as no designation yet)
        db_employee = Employee(
            user_id=db_user.id,
            employee_id=user_in.employee_id,
            name=user_in.full_name
        )
        db.add(db_employee)
        db.commit()
    
    return db_user

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(get_db),
    request: ForgotPasswordRequest
) -> Any:
    """
    Send OTP for password reset.
    """
    from app.models.user import User as UserModel
    user = user_service.get_by_username(db, username=request.username_or_email)
    if not user:
        user = db.query(UserModel).filter(UserModel.email == request.username_or_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Save OTP
    db_otp = OTP(
        user_id=user.id,
        code=otp_code,
        purpose=OTPPurpose.RESET
    )
    db.add(db_otp)
    db.commit()
    
    # SIMULATION: Log to console
    print(f"\n[OTP SIMULATION] Password reset OTP for {user.username}: {otp_code}\n")
    
    return {"message": "OTP sent to your registered email/phone"}

@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(get_db),
    request: PasswordResetRequest
) -> Any:
    """
    Reset password using OTP.
    """
    from app.models.user import User as UserModel
    user = user_service.get_by_username(db, username=request.username_or_email)
    if not user:
        user = db.query(UserModel).filter(UserModel.email == request.username_or_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify OTP
    # Check for latest unverified OTP within last 10 mins
    timeout = datetime.utcnow() - timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    db_otp = db.query(OTP).filter(
        OTP.user_id == user.id,
        OTP.code == request.code,
        OTP.purpose == OTPPurpose.RESET,
        OTP.is_verified == False,
        OTP.created_at >= timeout
    ).order_by(OTP.created_at.desc()).first()
    
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Update password
    from app.core.security import get_password_hash
    user.hashed_password = get_password_hash(request.new_password)
    db_otp.is_verified = True
    
    db.add(user)
    db.add(db_otp)
    db.commit()
    
    return {"message": "Password reset successful"}

@router.get("/me", response_model=User)
def read_user_me(
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Get current user."""
    return current_user


@router.get("/users/")
def list_users(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """List all users (for CMD to pick Enquiry Officers)."""
    from app.models.user import User as UserModel
    users = db.query(UserModel).filter(UserModel.is_active == True).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
        }
        for u in users
    ]
