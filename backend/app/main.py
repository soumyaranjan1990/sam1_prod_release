from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Import all models so they are registered with Base.metadata before routers
from app.models import user, case, complaint, employee, notification
from app.api.v1 import auth, cases, complaints, employees, notifications
from app.db.session import engine, SessionLocal
from app.db.base_class import Base

from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import text

app = FastAPI(
    title="DCMTS API",
    description="Disciplinary Case Management & Tracking System API",
    version="1.0.0"
)

# Create uploads directory if it doesn't exist
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Set up CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Create all database tables
    Base.metadata.create_all(bind=engine)

    # Backward-compatibility patch for older SQLite DBs missing new Case columns.
    if engine.url.get_backend_name() == "sqlite":
        with engine.begin() as conn:
            cols = conn.execute(text("PRAGMA table_info('case')")).fetchall()
            col_names = {c[1] for c in cols}
            if "concurrence_committee_id" not in col_names:
                conn.execute(text('ALTER TABLE "case" ADD COLUMN concurrence_committee_id INTEGER'))
            if "appeal_authority_id" not in col_names:
                conn.execute(text('ALTER TABLE "case" ADD COLUMN appeal_authority_id INTEGER'))
    
    # Seed a default CMD admin user if none exists
    from app.services.user import user as user_service
    from app.core.security import get_password_hash
    db = SessionLocal()
    try:
        existing = user_service.get_by_username(db, username="admin")
        if not existing:
            from app.models.user import User, UserRole
            admin_user = User(
                username="admin",
                email="admin@dcmts.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.CMD,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("[SEED] Created default admin user: admin / admin123")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "Welcome to DCMTS API"}

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["cases"])
app.include_router(complaints.router, prefix="/api/v1/complaints", tags=["complaints"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["employees"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])

