from app.db.session import SessionLocal
from app.models import employee
from sqlalchemy import text

def seed_test_isolation():
    db = SessionLocal()
    try:
        # Create Circles if not exists
        corp_circle = db.query(employee.Circle).filter(employee.Circle.code == "CORP").first()
        if not corp_circle:
            corp_circle = employee.Circle(name="Corporate Office", code="CORP")
            db.add(corp_circle)
            db.flush()

        # Create Designations
        designations = ["Enquiry Officer", "Disciplinary Authority", "Controlling Officer", "Complaint Officer"]
        db_desigs = {}
        for title in designations:
            existing = db.query(employee.Designation).filter(employee.Designation.title == title).first()
            if not existing:
                d = employee.Designation(title=title)
                db.add(d)
                db.flush()
                db_desigs[title] = d
            else:
                db_desigs[title] = existing

        # Test Employees Set A
        test_emps_a = [
            ("EOA1", "EO Alpha One", "Enquiry Officer"),
            ("DAA1", "DA Alpha One", "Disciplinary Authority"),
            ("COA1", "CO Alpha One", "Controlling Officer"),
            ("CMTA1", "CMT Alpha One", "Complaint Officer"),
        ]
        
        # Test Employees Set B
        test_emps_b = [
            ("EOB2", "EO Beta Two", "Enquiry Officer"),
            ("DAB2", "DA Beta Two", "Disciplinary Authority"),
            ("COB2", "CO Beta Two", "Controlling Officer"),
            ("CMTB2", "CMT Beta Two", "Complaint Officer"),
        ]

        # Test Employees Set C (Ready for Signup testing)
        test_emps_c = [
            ("SIGNUP_EO", "Signup Test EO", "Enquiry Officer"),
            ("SIGNUP_DA", "Signup Test DA", "Disciplinary Authority"),
        ]

        for eid, name, desig_title in test_emps_a + test_emps_b + test_emps_c:
            # ... (exists as per previous chunk)
            existing_emp = db.query(employee.Employee).filter(employee.Employee.employee_id == eid).first()
            if not existing_emp:
                new_emp = employee.Employee(
                    employee_id=eid,
                    name=name,
                    designation_id=db_desigs[desig_title].id,
                    circle_id=corp_circle.id,
                    class_of_service=employee.ServiceClass.CLASS_1
                )
                db.add(new_emp)
                db.flush()
                existing_emp = new_emp
                print(f"Created Test Employee: {name} ({eid})")

            # 2. Ensure User exists for this employee (ONLY for Set A and B)
            if eid in [e[0] for e in test_emps_a + test_emps_b]:
                from app.models.user import User, UserRole
                from app.core.security import get_password_hash
                
                existing_user = db.query(User).filter(User.username == eid).first()
                if not existing_user:
                    # Determine role directly from designation title for seeding
                    role_map = {
                        "Enquiry Officer": UserRole.ENQUIRY_OFFICER,
                        "Disciplinary Authority": UserRole.DA,
                        "Controlling Officer": UserRole.CO,
                        "Complaint Officer": UserRole.COMPLAINT_OFFICER
                    }
                    
                    new_user = User(
                        username=eid,
                        email=f"{eid.lower()}@test.com",
                        hashed_password=get_password_hash("password123"),
                        role=role_map[desig_title],
                        is_active=True
                    )
                    db.add(new_user)
                    db.flush()
                    
                    # Link employee to user
                    existing_emp.user_id = new_user.id
                    db.add(existing_emp)
                    print(f"Created User for {eid} with role {new_user.role}")

        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_isolation()
