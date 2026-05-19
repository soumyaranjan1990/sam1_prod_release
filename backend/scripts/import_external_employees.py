import csv
import json
import os
import sys
from typing import List, Dict, Any

# Add parent dir to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import SessionLocal
from app.models.employee import Employee, Designation, Circle, ServiceClass

def import_from_csv(file_path: str):
    db = SessionLocal()
    try:
        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                process_row(db, row)
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

def process_row(db, row: Dict[str, Any]):
    eid = row.get('employee_id')
    name = row.get('name')
    desig_title = row.get('designation')
    circle_code = row.get('circle')
    service_class = row.get('service_class', 'CLASS_2')

    if not eid or not name:
        return

    # 1. Resolve Designation
    designation = db.query(Designation).filter(Designation.title.ilike(desig_title)).first()
    if not designation and desig_title:
        designation = Designation(title=desig_title)
        db.add(designation)
        db.flush()

    # 2. Resolve Circle
    circle = db.query(Circle).filter(Circle.code == circle_code).first()
    if not circle and circle_code:
        circle = Circle(name=circle_code, code=circle_code)
        db.add(circle)
        db.flush()

    # 3. Create/Update Employee
    existing = db.query(Employee).filter(Employee.employee_id == eid).first()
    if not existing:
        new_emp = Employee(
            employee_id=eid,
            name=name,
            designation_id=designation.id if designation else None,
            circle_id=circle.id if circle else None,
            class_of_service=ServiceClass(service_class) if service_class in [s.value for s in ServiceClass] else ServiceClass.CLASS_2
        )
        db.add(new_emp)
        print(f"Imported: {name} ({eid})")
    else:
        print(f"Skipped: {eid} (already exists)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_external_employees.py <path_to_csv>")
        sys.exit(1)
    
    import_from_csv(sys.argv[1])
