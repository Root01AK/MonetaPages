from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import asc
from typing import List, Optional
from datetime import date
import uuid, os, shutil

from database import get_db
import models, schemas, auth

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def compute_running_balances(transactions: list, opening_balance: float) -> list:
    """Attach running_balance to each transaction sorted by date."""
    sorted_txs = sorted(transactions, key=lambda t: (str(t.date), t.id))
    balance = opening_balance
    result = []
    for tx in sorted_txs:
        if tx.type == models.TransactionType.income:
            balance += tx.amount
        else:
            balance -= tx.amount
        result.append(schemas.TransactionWithBalance(
            **{c.name: getattr(tx, c.name) for c in tx.__table__.columns},
            running_balance=round(balance, 2)
        ))
    return result


def get_opening_balance(db: Session, user_id: int) -> float:
    setting = db.query(models.Settings).filter_by(key="opening_balance", user_id=user_id).first()
    return float(setting.value) if setting else 0.0


# ── GET all transactions (with filters) ─────────────────────────
@router.get("/", response_model=List[schemas.TransactionWithBalance])
def get_transactions(
    month: Optional[str] = Query(None, description="Filter by YYYY-MM"),
    day: Optional[str] = Query(None, description="Filter by YYYY-MM-DD"),
    type: Optional[schemas.TransactionType] = None,
    category: Optional[schemas.TransactionCategory] = None,
    search: Optional[str] = None,
    with_balance: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(asc(models.Transaction.date), asc(models.Transaction.id))

    if month:
        try:
            from datetime import date as dt_date
            import calendar
            y, m = map(int, month.split("-"))
            _, last_day = calendar.monthrange(y, m)
            query = query.filter(models.Transaction.date >= dt_date(y, m, 1), models.Transaction.date <= dt_date(y, m, last_day))
        except Exception:
            pass
    if day:
        query = query.filter(models.Transaction.date == day)
    if type:
        query = query.filter(models.Transaction.type == type)
    if category:
        query = query.filter(models.Transaction.category == category)
    if search:
        query = query.filter(
            models.Transaction.description.ilike(f"%{search}%") |
            models.Transaction.notes.ilike(f"%{search}%")
        )

    txs = query.all()
    if not with_balance:
        return txs

    opening_balance = get_opening_balance(db, current_user.id)
    return compute_running_balances(txs, opening_balance)


# ── GET single transaction ───────────────────────────────────────
@router.get("/{tx_id}", response_model=schemas.TransactionWithBalance)
def get_transaction(tx_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tx = db.query(models.Transaction).filter_by(id=tx_id, user_id=current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    opening_balance = get_opening_balance(db, current_user.id)
    all_txs = db.query(models.Transaction).filter_by(user_id=current_user.id).order_by(
        asc(models.Transaction.date), asc(models.Transaction.id)
    ).all()
    with_bal = compute_running_balances(all_txs, opening_balance)
    match = next((t for t in with_bal if t.id == tx_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return match


# ── CREATE transaction ───────────────────────────────────────────
@router.post("/", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_tx = models.Transaction(**tx.dict(), user_id=current_user.id)
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx


# ── CREATE transaction WITH screenshot ──────────────────────────
@router.post("/with-screenshot", response_model=schemas.TransactionOut, status_code=201)
async def create_transaction_with_screenshot(
    date: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    amount: float = Form(...),
    client_id: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    screenshot_path = None
    screenshot_name = None

    if screenshot and screenshot.filename:
        if screenshot.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Use JPEG, PNG, GIF or WebP.")
        content = await screenshot.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
        ext = screenshot.filename.rsplit(".", 1)[-1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        screenshot_path = f"/uploads/{filename}"
        screenshot_name = screenshot.filename

    tx = models.Transaction(
        user_id=current_user.id,
        date=date,
        type=type,
        category=category,
        description=description,
        amount=round(amount, 2),
        client_id=client_id,
        notes=notes,
        screenshot_path=screenshot_path,
        screenshot_name=screenshot_name,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


# ── UPDATE transaction ───────────────────────────────────────────
@router.put("/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(tx_id: int, tx_data: schemas.TransactionUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tx = db.query(models.Transaction).filter_by(id=tx_id, user_id=current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for k, v in tx_data.dict().items():
        setattr(tx, k, v)
    db.commit()
    db.refresh(tx)
    return tx


# ── UPDATE screenshot only ───────────────────────────────────────
@router.patch("/{tx_id}/screenshot", response_model=schemas.TransactionOut)
async def update_screenshot(tx_id: int, screenshot: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tx = db.query(models.Transaction).filter_by(id=tx_id, user_id=current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if screenshot.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type.")
    content = await screenshot.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    # Remove old screenshot
    if tx.screenshot_path:
        old_path = tx.screenshot_path.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    ext = screenshot.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    tx.screenshot_path = f"/uploads/{filename}"
    tx.screenshot_name = screenshot.filename
    db.commit()
    db.refresh(tx)
    return tx


# ── DELETE transaction ───────────────────────────────────────────
@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tx = db.query(models.Transaction).filter_by(id=tx_id, user_id=current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if tx.screenshot_path:
        path = tx.screenshot_path.lstrip("/")
        if os.path.exists(path):
            os.remove(path)
    db.delete(tx)
    db.commit()
