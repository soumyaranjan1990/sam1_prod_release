from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, cases, complaints, employees
from app.db.session import engine, SessionLocal
from app.db.base_class import Base
# Import all models so they are registered with Base.metadata
from app.models import user, case, complaint, employee

app = FastAPI(
    title="DCMTS API",
    description="Disciplinary Case Management & Tracking System API",
    version="1.0.0"
)

# Set up CORS
origins = [
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
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

