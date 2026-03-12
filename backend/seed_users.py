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
                print(f"[SEED] Created user: {username} with role: {role}")
            else:
                print(f"[SEED] User {username} already exists")
        
        db.commit()
    except Exception as e:
        print(f"[ERROR] Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
