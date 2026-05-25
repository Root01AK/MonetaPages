from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from database import get_db
import models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.EventOut])
def get_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    month: str = None  # YYYY-MM
):
    query = db.query(models.Event).filter(models.Event.user_id == current_user.id)
    if month:
        try:
            from datetime import date as dt_date
            import calendar
            y, m = map(int, month.split("-"))
            _, last_day = calendar.monthrange(y, m)
            query = query.filter(models.Event.date >= dt_date(y, m, 1), models.Event.date <= dt_date(y, m, last_day))
        except Exception:
            pass
    return query.all()

@router.post("/", response_model=schemas.EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_event = models.Event(**event.dict(), user_id=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/{event_id}", response_model=schemas.EventOut)
def update_event(
    event_id: int,
    event_in: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for k, v in event_in.dict().items():
        setattr(db_event, k, v)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.user_id == current_user.id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return None
