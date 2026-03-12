from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.employee import EmployeeCreate, Employee
from app.models.employee import Employee as EmployeeModel

router = APIRouter()

@router.post("/", response_model=Employee)
def create_employee(
    *,
    db: Session = Depends(get_db),
    employee_in: EmployeeCreate,
) -> Any:
    """
    Create new employee.
    """
    db_obj = EmployeeModel(
        employee_id=employee_in.employee_id,
        name=employee_in.name,
        class_of_service=employee_in.class_of_service,
        user_id=employee_in.user_id,
        designation_id=employee_in.designation_id,
        circle_id=employee_in.circle_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[Employee])
def read_employees(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve employees.
    """
    employees = db.query(EmployeeModel).offset(skip).limit(limit).all()
    return employees
