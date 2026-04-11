from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class ComplaintType(str, enum.Enum):
    VIGILANCE = "VIGILANCE"
    SERVICE = "SERVICE"
    MISCONDUCT = "MISCONDUCT"
    OTHER = "OTHER"

class ComplaintMode(str, enum.Enum):
    LETTER = "LETTER"
    EMAIL = "EMAIL"
    ONLINE = "ONLINE"
    INTERNAL = "INTERNAL"

class ComplaintCategory(str, enum.Enum):
    CORRUPTION = "CORRUPTION"
    NEGLIGENCE = "NEGLIGENCE"
    MISCONDUCT = "MISCONDUCT"

# Association table for Complaint and Employee (Tagged employees)
class ComplaintEmployee(Base):
    __tablename__ = "complaint_employee"
    
    complaint_id = Column(Integer, ForeignKey("complaint.id"), primary_key=True)
    employee_id = Column(Integer, ForeignKey("employee.id"), primary_key=True)

    complaint = relationship("Complaint", back_populates="employees")
    employee = relationship("Employee", back_populates="complaints")

class Complaint(Base):
    __tablename__ = "complaint"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True)
    file_number = Column(String(50), unique=True, index=True)
    registered_by_id = Column(Integer, ForeignKey("user.id"))
    
    complaint_title = Column(String(255), default="No Title")
    details = Column(Text, nullable=False)
    
    complaint_type = Column(Enum(ComplaintType), default=ComplaintType.SERVICE)
    complaint_mode = Column(Enum(ComplaintMode), default=ComplaintMode.LETTER)
    complaint_category = Column(Enum(ComplaintCategory), default=ComplaintCategory.MISCONDUCT)
    
    circle_id = Column(Integer, ForeignKey("circle.id"), nullable=True)
    department = Column(String(100), nullable=True)
    date_of_receipt = Column(Date, server_default=func.current_date())
    complainant_name = Column(String(255), nullable=True)
    complainant_type = Column(String(100), nullable=True) # Consumer, Employee, etc.
    complainant_employee_id = Column(Integer, ForeignKey("employee.id"), nullable=True)
    
    document_path = Column(String(255), nullable=True) # Moving from FileField to path
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    registered_by = relationship("User", foreign_keys=[registered_by_id])
    circle = relationship("Circle", back_populates="complaints")
    case = relationship("Case", back_populates="complaint", uselist=False)
    employees = relationship("ComplaintEmployee", back_populates="complaint")

    @property
    def status(self):
        if self.case:
            return self.case.status
        return "REGISTERED"

    @property
    def updated_at(self):
        if self.case and self.case.updated_at:
            return self.case.updated_at
        return self.created_at
