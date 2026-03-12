from typing import Optional, List
from pydantic import BaseModel
from app.models.employee import ServiceClass

class DesignationBase(BaseModel):
    title: str

class Designation(DesignationBase):
    id: int

    class Config:
        from_attributes = True

class CircleBase(BaseModel):
    name: str
    code: str

class Circle(CircleBase):
    id: int

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    class_of_service: Optional[ServiceClass] = None

class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None
    designation_id: Optional[int] = None
    circle_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    designation_id: Optional[int] = None
    circle_id: Optional[int] = None
    class_of_service: Optional[ServiceClass] = None

class Employee(EmployeeBase):
    id: int
    user_id: Optional[int]
    designation_id: Optional[int]
    circle_id: Optional[int]
    
    designation: Optional[Designation] = None
    circle: Optional[Circle] = None

    class Config:
        from_attributes = True
