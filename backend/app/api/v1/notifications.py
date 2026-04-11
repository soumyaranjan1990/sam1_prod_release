from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.notification import Notification
from app.api.deps import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    link: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Fetch all notifications for the logged-in user, newest first."""
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark a single notification as read."""
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.recipient_id == current_user.id,
        )
        .first()
    )
    if notif:
        notif.is_read = True
        db.commit()
    return {"ok": True}


@router.patch("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark every notification for the current user as read."""
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
