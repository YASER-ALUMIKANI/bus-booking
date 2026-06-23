import os
import time
import logging
import sqlite3
from pathlib import Path
from flask import g
from werkzeug.security import generate_password_hash

logger = logging.getLogger(__name__)

# Base directory points to the project root (parent of backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_FILE = BASE_DIR / "app.db"

UPLOAD_DIR = BASE_DIR / "uploads" / "passports"
PAYMENT_UPLOAD_DIR = BASE_DIR / "uploads" / "payments"
VERIFICATION_UPLOAD_DIR = BASE_DIR / "uploads" / "verifications"
DIST_DIR = BASE_DIR / "dist"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PAYMENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VERIFICATION_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_ADMIN_USERS = {
    "manager": {"password": "admin123", "role": "manager"},
    "employee": {"password": "employee123", "role": "employee"},
}

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = sqlite3.connect(DB_FILE, check_same_thread=False)
        db.row_factory = sqlite3.Row
        # Enable WAL mode for high concurrency
        db.execute("PRAGMA journal_mode=WAL;")
        g._database = db
    return db

def init_db():
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL
        )
        """
    )
    # Keep admin tokens persistent across restarts using sqlite database
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_tokens (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS client_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS verification_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            fullname TEXT NOT NULL,
            identity_type TEXT NOT NULL,
            identity_number TEXT NOT NULL,
            issue_date TEXT NOT NULL,
            issue_place TEXT NOT NULL,
            identity_image TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at INTEGER NOT NULL,
            FOREIGN KEY(phone) REFERENCES client_users(phone)
        )
        """
    )
    
    for username, entry in DEFAULT_ADMIN_USERS.items():
        row = db.execute("SELECT 1 FROM admin_users WHERE username = ?", (username,)).fetchone()
        if row is None:
            env_pass_key = f"ADMIN_{username.upper()}_PASSWORD"
            password = os.environ.get(env_pass_key)
            if not password:
                password = entry["password"]
                logger.warning("SECURITY WARNING: Using default hardcoded password for %s. Set %s env variable in production.", username, env_pass_key)
            db.execute(
                "INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)",
                (username, generate_password_hash(password), entry["role"]),
            )

    db.execute(
        """
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            passenger_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            passport TEXT NOT NULL,
            travel_date TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            status TEXT NOT NULL,
            requested_status TEXT,
            cancellation_reason TEXT,
            requested_cancellation_reason TEXT,
            locked INTEGER NOT NULL,
            change_requested INTEGER NOT NULL,
            approval_granted INTEGER NOT NULL,
            guest INTEGER NOT NULL,
            timestamp INTEGER NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            travel_date TEXT NOT NULL,
            company TEXT NOT NULL,
            UNIQUE(travel_date, company)
        )
        """
    )
    
    # Migrate company column if it exists in old format
    schedules_cols = [row[1] for row in db.execute("PRAGMA table_info(schedules)").fetchall()]
    if "company" not in schedules_cols:
        has_old = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='schedules'").fetchone()
        if has_old:
            db.execute("ALTER TABLE schedules RENAME TO schedules_old")
            db.execute(
                """
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    travel_date TEXT NOT NULL,
                    company TEXT NOT NULL,
                    UNIQUE(travel_date, company)
                )
                """
            )
            db.execute("INSERT OR IGNORE INTO schedules (id, travel_date, company) SELECT id, travel_date, 'البركة' FROM schedules_old")
            db.execute("DROP TABLE schedules_old")

    # Update schedules table columns
    schedules_cols = [row[1] for row in db.execute("PRAGMA table_info(schedules)").fetchall()]
    new_schedule_cols = {
        "price": "INTEGER NOT NULL DEFAULT 35000",
        "price_adult": "INTEGER NOT NULL DEFAULT 35000",
        "price_child": "INTEGER NOT NULL DEFAULT 35000",
        "bus_type": "TEXT NOT NULL DEFAULT 'VIP'",
        "total_seats": "INTEGER NOT NULL DEFAULT 40",
        "trip_time": "TEXT NOT NULL DEFAULT '06:30:00 PM'",
        "notes": "TEXT NOT NULL DEFAULT 'الصعود من عفار'",
        "issuing_office": "TEXT NOT NULL DEFAULT 'وكيل اب مساعد كامل'"
    }
    for col_name, col_def in new_schedule_cols.items():
        if col_name not in schedules_cols:
            db.execute(f"ALTER TABLE schedules ADD COLUMN {col_name} {col_def}")

    # Update bookings table columns
    columns = [row[1] for row in db.execute("PRAGMA table_info(bookings)").fetchall()]
    if "cancellation_reason" not in columns:
        db.execute("ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT")
    if "requested_cancellation_reason" not in columns:
        db.execute("ALTER TABLE bookings ADD COLUMN requested_cancellation_reason TEXT")
    if "passport_image" not in columns:
        db.execute("ALTER TABLE bookings ADD COLUMN passport_image TEXT")

    new_booking_cols = {
        "company": "TEXT",
        "seat": "INTEGER",
        "dob": "TEXT",
        "trip_time": "TEXT",
        "arrival_time": "TEXT",
        "day_of_week": "TEXT",
        "issuing_office": "TEXT",
        "price": "INTEGER",
        "notes": "TEXT",
        "bus_type": "TEXT",
        "payment_ref": "TEXT",
        "payment_image": "TEXT"
    }
    for col_name, col_type in new_booking_cols.items():
        if col_name not in columns:
            db.execute(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}")

    db.commit()


_csrf_override = None

def require_csrf_token():
    if _csrf_override is not None:
        return _csrf_override()
    from flask import request, session
    csrf_token = request.headers.get("X-CSRF-Token")
    return csrf_token and csrf_token == session.get("csrf_token")


def get_or_create_csrf_token() -> str:
    import secrets
    from flask import session
    csrf_token = session.get("csrf_token")
    if not csrf_token:
        csrf_token = secrets.token_hex(32)
        session["csrf_token"] = csrf_token
    return csrf_token

