from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date, datetime
from enum import Enum


# ── User & Auth Schemas ──────────────────────────────────────────
class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str
    full_name: Optional[str] = None


class UserOut(UserBase):
    id: int
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class TransactionType(str, Enum):
    income = "income"
    expense = "expense"


class TransactionCategory(str, Enum):
    client = "client"
    company = "company"
    personal = "personal"


# ── Transaction Schemas ──────────────────────────────────────────
class TransactionBase(BaseModel):
    date: date
    type: TransactionType
    category: TransactionCategory
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    client_id: Optional[int] = None
    notes: Optional[str] = None

    @validator("amount")
    def amount_precision(cls, v):
        return round(v, 2)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    screenshot_path: Optional[str] = None
    screenshot_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TransactionWithBalance(TransactionOut):
    running_balance: float


# ── Settings Schemas ─────────────────────────────────────────────
class SettingOut(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True


class OpeningBalanceUpdate(BaseModel):
    opening_balance: float = Field(..., ge=0)


# ── Report Schemas ───────────────────────────────────────────────
class MonthlySummary(BaseModel):
    month: str           # YYYY-MM
    opening_balance: float
    total_income: float
    total_expense: float
    client_expense: float
    company_expense: float
    personal_expense: float
    closing_balance: float
    transaction_count: int


class DailySummary(BaseModel):
    date: str            # YYYY-MM-DD
    opening_balance: float
    total_income: float
    total_expense: float
    client_expense: float
    company_expense: float
    personal_expense: float
    closing_balance: float
    transaction_count: int


class OverallSummary(BaseModel):
    opening_balance: float
    total_income: float
    total_expense: float
    client_expense: float
    company_expense: float
    personal_expense: float
    closing_balance: float
    net_profit_loss: float
    total_transactions: int
# ── Client Schemas ───────────────────────────────────────────────
class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Event Schemas ────────────────────────────────────────────────
class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    date: date
    time: Optional[str] = None
    color: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    pass

class EventOut(EventBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Task Schemas ─────────────────────────────────────────────────
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    is_done: int = 0
    due_date: Optional[date] = None
    priority: str = "medium"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class TaskOut(TaskBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Reminder Schemas ─────────────────────────────────────────────
class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    remind_at: datetime

class ReminderCreate(ReminderBase):
    pass

class ReminderOut(ReminderBase):
    id: int
    is_sent: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── SMTP Settings Schema ─────────────────────────────────────────
class SmtpConfigUpdate(BaseModel):
    smtp_server: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    smtp_from_email: str
    recipient_email: Optional[str] = None


# ── Budget Schemas ───────────────────────────────────────────────
class BudgetBase(BaseModel):
    category: TransactionCategory
    amount: float = Field(..., gt=0)
    month: str # YYYY-MM

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BudgetBase):
    pass

class BudgetOut(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class BudgetSummary(BaseModel):
    category: str
    budget: float
    spent: float
    remaining: float
    percent: float
