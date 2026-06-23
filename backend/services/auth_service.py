import time
import logging
from flask import request
from backend.database.db import get_db

logger = logging.getLogger(__name__)

def get_client_user(phone):
    db = get_db()
    return db.execute("SELECT * FROM client_users WHERE phone = ?", (phone,)).fetchone()

def get_admin_user(username):
    db = get_db()
    return db.execute("SELECT * FROM admin_users WHERE username = ?", (username,)).fetchone()

def verify_token(token: str):
    if not token:
        return None
    db = get_db()
    row = db.execute("SELECT username, role, created_at FROM admin_tokens WHERE token = ?", (token,)).fetchone()
    if not row:
        return None
    # 7-day expiration
    if int(time.time()) - row["created_at"] > 7 * 24 * 3600:
        db.execute("DELETE FROM admin_tokens WHERE token = ?", (token,))
        db.commit()
        return None
    return {"username": row["username"], "role": row["role"]}

def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1]
        return verify_token(token)
    return None

def require_token():
    return get_current_user()
