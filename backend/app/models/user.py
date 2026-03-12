from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    COMPLAINT_OFFICER = "COMPLAINT_OFFICER"
    CMD = "CMD"
    ENQUIRY_OFFICER = "ENQUIRY_OFFICER"
    CO = "CO"
    DA = "DA"
    CONCURRENCE_COMMITTEE = "CONCURRENCE_COMMITTEE"
    APPEAL_AUTHORITY = "APPEAL_AUTHORITY"
    CIRCLE_HEAD = "CIRCLE_HEAD"
    GM = "GM"

class OTPPurpose(str, enum.Enum):
    LOGIN = "LOGIN"
    RESET = "RESET"

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    employee_id = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_first_login = Column(Boolean, default=True)
    
    employee_profile = relationship("Employee", back_populates="user", uselist=False)
    otps = relationship("OTP", back_populates="user")

class OTP(Base):
    __tablename__ = "otp"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    code = Column(String(6), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_verified = Column(Boolean, default=False)
    purpose = Column(Enum(OTPPurpose), default=OTPPurpose.LOGIN)

    user = relationship("User", back_populates="otps")
