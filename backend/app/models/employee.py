from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class ServiceClass(str, enum.Enum):
    CLASS_1 = "CLASS_1"
    CLASS_2 = "CLASS_2"
    CLASS_3 = "CLASS_3"
    CLASS_4 = "CLASS_4"

class Circle(Base):
    __tablename__ = "circle"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)

    employees = relationship("Employee", back_populates="circle")
    complaints = relationship("Complaint", back_populates="circle")

class Designation(Base):
    __tablename__ = "designation"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)

    employees = relationship("Employee", back_populates="designation")

class Employee(Base):
    __tablename__ = "employee"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), unique=True)
    employee_id = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    designation_id = Column(Integer, ForeignKey("designation.id"))
    circle_id = Column(Integer, ForeignKey("circle.id"))
    class_of_service = Column(Enum(ServiceClass))

    user = relationship("User", back_populates="employee_profile")
    designation = relationship("Designation", back_populates="employees")
    circle = relationship("Circle", back_populates="employees")
    
    # complaints where this employee is tagged
    complaints = relationship("ComplaintEmployee", back_populates="employee")
