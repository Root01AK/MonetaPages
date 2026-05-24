import sys
sys.path.append('.')
from datetime import date, datetime
import schemas

try:
    tx = schemas.TransactionWithBalance(
        id=1,
        date=date(2026, 5, 24),
        type="income",
        category="company",
        description="Test",
        amount=100.0,
        client_id=None,
        notes=None,
        running_balance=100.0,
        screenshot_path=None,
        screenshot_name=None,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    print("Success:", tx)
except Exception as e:
    print("Failed with:", e)
