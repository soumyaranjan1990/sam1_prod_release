from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models import employee, complaint, case # Import to avoid relationship errors

def seed_users():
    db = SessionLocal()
    roles = [
        ("cmd_user", UserRole.CMD),
        ("co_user", UserRole.COMPLAINT_OFFICER),
        ("emp_user", UserRole.EMPLOYEE),
        ("eo_user", UserRole.ENQUIRY_OFFICER),
        ("da_user", UserRole.DA),
        ("cont_user", UserRole.CO),
        ("cc_user", UserRole.CONCURRENCE_COMMITTEE),
        ("aa_user", UserRole.APPEAL_AUTHORITY),
        ("ch_user", UserRole.CIRCLE_HEAD),
        ("gm_user", UserRole.GM)
    ]
    
    password = "password123"
    hashed_password = get_password_hash(password)
    
    try:
        # 1. Seed Circles
        circles = [
            ("Corporate Office", "CORP"),
            ("Circle A", "CIRA"),
        ]
        db_circles = {}
        for name, code in circles:
            existing = db.query(employee.Circle).filter(employee.Circle.code == code).first()
            if not existing:
                c = employee.Circle(name=name, code=code)
                db.add(c)
                db.flush()
                db_circles[code] = c
                print(f"[SEED] Created Circle: {name}")
            else:
                db_circles[code] = existing

        # 2. Seed Designations
        designations = ["Assistant Manager", "Divisional Engineer", "CMD", "Enquiry Officer", "Disciplinary Authority"]
        db_desigs = {}
        for title in designations:
            existing = db.query(employee.Designation).filter(employee.Designation.title == title).first()
            if not existing:
                d = employee.Designation(title=title)
                db.add(d)
                db.flush()
                db_desigs[title] = d
                print(f"[SEED] Created Designation: {title}")
            else:
                db_desigs[title] = existing

        # 3. Seed Users
        for username, role in roles:
            existing = db.query(User).filter(User.username == username).first()
            if not existing:
                user = User(
                    username=username,
                    email=f"{username}@dcmts.com",
                    hashed_password=hashed_password,
                    role=role,
                    is_active=True,
                )
                db.add(user)
                db.flush()
                print(f"[SEED] Created user: {username} with role: {role}")
            else:
                user = existing
                print(f"[SEED] User {username} already exists")
            
            # Link emp_user to an employee profile if not exists
            if username == "emp_user":
                emp_profile = db.query(employee.Employee).filter(employee.Employee.user_id == user.id).first()
                if not emp_profile:
                    new_emp = employee.Employee(
                        user_id=user.id,
                        employee_id="EMP001",
                        name="Test Employee",
                        designation_id=db_desigs["Assistant Manager"].id,
                        circle_id=db_circles["CORP"].id,
                        class_of_service=employee.ServiceClass.CLASS_1
                    )
                    db.add(new_emp)
                    print(f"[SEED] Created employee profile for emp_user")

        # 4. Seed Standalone Test Employees (for tagging)
        test_emps = [
            ("101", "John Doe", "Divisional Engineer", "CIRA"),
            ("102", "Jane Smith", "Assistant Manager", "CORP"),
            ("103", "Alice Johnson", "Assistant Manager", "CIRA"),
            ("104", "Bob Wilson", "Divisional Engineer", "CORP"),
            ("105", "Charlie Brown", "Enquiry Officer", "CORP"),
            ("106", "David Miller", "Assistant Manager", "CIRA"),
            ("107", "Emily Davis", "Divisional Engineer", "CIRA"),
            ("108", "Frank Miller", "Assistant Manager", "CORP"),
            ("109", "Grace Wilson", "Divisional Engineer", "CIRA"),
            ("110", "Henry Davis", "Assistant Manager", "CORP"),
            ("201", "CMD Office Admin", "CMD", "CORP"),
            ("202", "Lead Investigator", "Enquiry Officer", "CORP"),
            ("203", "Auth Officer", "Disciplinary Authority", "CIRA")
        ]
        for eid, name, desig_title, circ_code in test_emps:
            existing = db.query(employee.Employee).filter(employee.Employee.employee_id == eid).first()
            if not existing:
                new_emp = employee.Employee(
                    employee_id=eid,
                    name=name,
                    designation_id=db_desigs[desig_title].id,
                    circle_id=db_circles[circ_code].id,
                    class_of_service=employee.ServiceClass.CLASS_2
                )
                db.add(new_emp)
                print(f"[SEED] Created standalone test employee: {name} ({eid})")

        db.commit()
    except Exception as e:
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
