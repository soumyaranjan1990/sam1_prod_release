from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class CaseStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    UNDER_ENQUIRY = "UNDER_ENQUIRY"
    ENQUIRY_COMPLETED = "ENQUIRY_COMPLETED"
    ALLEGATION_NOT_PROVED = "ALLEGATION_NOT_PROVED"
    ALLEGATION_PROVED = "ALLEGATION_PROVED"
    MINOR_PROPOSED_PUNISHMENT = "MINOR_PROPOSED_PUNISHMENT"
    MINOR_FINAL_ORDER_ISSUED = "MINOR_FINAL_ORDER_ISSUED"
    CHARGE_MEMO_ISSUED = "CHARGE_MEMO_ISSUED"
    SHOW_CAUSE_ISSUED = "SHOW_CAUSE_ISSUED"
    AWAITING_EMPLOYEE_RESPONSE = "AWAITING_EMPLOYEE_RESPONSE"
    REMINDER_1_SENT = "REMINDER_1_SENT"
    REMINDER_2_SENT = "REMINDER_2_SENT"
    FINAL_OPPORTUNITY_SENT = "FINAL_OPPORTUNITY_SENT"
    EX_PARTE_PROCEEDED = "EX_PARTE_PROCEEDED"
    DISCIPLINARY_ORDER_PENDING = "DISCIPLINARY_ORDER_PENDING"
    UNDER_CONCURRENCE_REVIEW = "UNDER_CONCURRENCE_REVIEW"
    FINAL_ORDER_ISSUED_CONCURRED = "FINAL_ORDER_ISSUED_CONCURRED"
    FINAL_ORDER_ISSUED_MODIFIED = "FINAL_ORDER_ISSUED_MODIFIED"
    FINAL_ORDER_ISSUED_EX_PARTE = "FINAL_ORDER_ISSUED_EX_PARTE"
    APPEAL_WINDOW_OPEN = "APPEAL_WINDOW_OPEN"
    APPEAL_UNDER_REVIEW = "APPEAL_UNDER_REVIEW"
    CASE_CLOSED = "CASE_CLOSED"

class Gravity(str, enum.Enum):
    MINOR = "MINOR"
    MAJOR = "MAJOR"

class Case(Base):
    __tablename__ = "case"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaint.id"), unique=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.REGISTERED)
    gravity = Column(Enum(Gravity), default=Gravity.MINOR)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    complaint = relationship("Complaint", back_populates="case")
    history = relationship("CaseHistory", back_populates="case")

class CaseHistory(Base):
    __tablename__ = "case_history"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("case.id"))
    from_status = Column(Enum(CaseStatus))
    to_status = Column(Enum(CaseStatus))
    action_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="history")
    action_by = relationship("User")
