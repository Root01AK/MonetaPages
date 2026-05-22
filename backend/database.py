import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Priority: Environment variable, then SQLite fallback
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/moneta.db")

# Railway's PG url might use 'postgres://' which SQLAlchemy 1.4+ expects as 'postgresql://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite-specific directory creation and config
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

if is_sqlite:
    # Ensure absolute path for SQLite in Docker
    db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
    if db_path.startswith("./"):
        # Convert ./data/moneta.db to absolute path inside /app or equivalent
        base_dir = os.path.abspath(os.getcwd())
        abs_db_path = os.path.normpath(os.path.join(base_dir, db_path))
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{abs_db_path}"
        db_dir = os.path.dirname(abs_db_path)
    else:
        db_dir = os.path.dirname(db_path)
        
    if db_dir and not db_dir.startswith("http"):
        try:
            os.makedirs(db_dir, exist_ok=True)
            print(f"[DB] Initialized directory: {db_dir}")
        except Exception as e:
            print(f"[DB] Error creating directory {db_dir}: {e}")

print(f"[DB] Using Database URL: {SQLALCHEMY_DATABASE_URL.split('@')[-1]}") # Hide credentials

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
