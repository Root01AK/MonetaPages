import sys
sys.path.append('.')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models, schemas
from routers.transactions import compute_running_balances

SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/moneta.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    txs = db.query(models.Transaction).all()
    print(f"Total transactions: {len(txs)}")
    res = compute_running_balances(txs, 0.0)
    print(f"Successfully serialized {len(res)} transactions!")
except Exception as e:
    import traceback
    print("Serialization failed!")
    traceback.print_exc()
finally:
    db.close()
