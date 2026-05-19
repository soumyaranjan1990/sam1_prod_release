from app.db.session import SessionLocal
from app.models.case import Case, CaseStatus, Gravity
from app.models.user import User, UserRole
from datetime import datetime, timedelta

def fix_data():
    db = SessionLocal()
    try:
        # 1. Take some registered cases and move them to DA Review
        registered_cases = db.query(Case).filter(Case.status == CaseStatus.REGISTERED).limit(3).all()
        for i, c in enumerate(registered_cases):
            c.status = CaseStatus.UNDER_DA_REVIEW_MAJOR
            c.gravity = Gravity.MAJOR
            c.window_start_date = datetime.now() - timedelta(days=2)
            # Add a fake explanation path so the "View Explanation" button shows up
            c.employee_explanation_path = "uploads/complaints/test_explanation.pdf"
            print(f"Moved Case #{c.id} to UNDER_DA_REVIEW_MAJOR")

        # 2. Take another case and move it to CO for Timer demonstration
        co_case = db.query(Case).filter(Case.status == CaseStatus.REGISTERED).first()
        if co_case:
            co_case.status = CaseStatus.AWAITING_EMPLOYEE_RESPONSE
            co_case.gravity = Gravity.MAJOR
            co_case.controlling_officer_id = 3 # co_user@dcmts.local
            co_case.window_start_date = datetime.now() - timedelta(days=5)
            print(f"Moved Case #{co_case.id} to AWAITING_EMPLOYEE_RESPONSE for CO 3")

        # 3. Fix Case 26 (Appeal) timer
        case26 = db.query(Case).filter(Case.id == 26).first()
        if case26:
            case26.window_start_date = datetime.now() - timedelta(days=10)
            print(f"Fixed Case #26 window_start_date")

        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_data()

