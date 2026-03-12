from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.case import Case, CaseHistory, CaseStatus
from app.schemas.case import CaseCreate, CaseUpdate

class CRUDCase:
    def get(self, db: Session, id: int) -> Optional[Case]:
        return db.query(Case).filter(Case.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Case]:
        return db.query(Case).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CaseCreate) -> Case:
        db_obj = Case(
            complaint_id=obj_in.complaint_id,
            gravity=obj_in.gravity,
            status=CaseStatus.REGISTERED
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

case = CRUDCase()
