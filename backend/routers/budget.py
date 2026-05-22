from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func, extract

from database import get_db
import models, schemas, auth

router = APIRouter()

@router.get("/summary", response_model=List[schemas.BudgetSummary])
def get_budget_summary(
    month: str, # YYYY-MM
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns a summary of spent vs budget for each category in a given month.
    """
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.month == month
    ).all()
    
    # Get spending for the month
    try:
        year_num, month_num = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected YYYY-MM")

    spent_query = db.query(
        models.Transaction.category,
        func.sum(models.Transaction.amount).label("total")
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == models.TransactionType.expense,
        extract("year", models.Transaction.date) == year_num,
        extract("month", models.Transaction.date) == month_num
    ).group_by(models.Transaction.category).all()
    
    spent_map = {cat: amt for cat, amt in spent_query}
    
    results = []
    # Ensure all 3 categories are represented if they have budgets
    categories = ["client", "company", "personal"]
    budget_map = {b.category: b.amount for b in budgets}
    
    for cat in categories:
        b_amt = budget_map.get(cat, 0)
        s_amt = spent_map.get(cat, 0)
        
        if b_amt > 0:
            results.append(schemas.BudgetSummary(
                category=cat,
                budget=b_amt,
                spent=round(s_amt, 2),
                remaining=round(max(0, b_amt - s_amt), 2),
                percent=round((s_amt / b_amt) * 100, 1) if b_amt > 0 else 0
            ))
            
    return results

@router.post("/", response_model=schemas.BudgetOut)
def set_budget(
    budget: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Sets or updates a budget for a category/month.
    """
    db_budget = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.category == budget.category,
        models.Budget.month == budget.month
    ).first()
    
    if db_budget:
        db_budget.amount = budget.amount
    else:
        db_budget = models.Budget(**budget.dict(), user_id=current_user.id)
        db.add(db_budget)
        
    db.commit()
    db.refresh(db_budget)
    return db_budget
