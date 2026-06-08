import os
from pathlib import Path
import secrets
import sqlite3
import time
from flask import Flask, send_from_directory, abort, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "app.db"
DIST_DIR = BASE_DIR / "dist"

app = Flask(__name__, static_folder=str(DIST_DIR / "assets"), static_url_path="/assets")

BOOKING_RATE_LIMIT = 15
BOOKING_RATE_WINDOW_SECONDS = 60
booking_request_log = {}

DEFAULT_ADMIN_USERS = {
    "manager": {"password": "admin123", "role": "manager"},
    "employee": {"password": "employee123", "role": "employee"},
}
TOKENS = {}

VALID_STATUSES = {"pending", "confirmed", "cancelled"}


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = sqlite3.connect(DB_FILE, check_same_thread=False)
        db.row_factory = sqlite3.Row
        g._database = db
    return db


@app.teardown_appcontext
def close_connection(exception=None):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


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
    for username, entry in DEFAULT_ADMIN_USERS.items():
        row = db.execute("SELECT 1 FROM admin_users WHERE username = ?", (username,)).fetchone()
        if row is None:
            db.execute(
                "INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)",
                (username, generate_password_hash(entry["password"]), entry["role"]),
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
            travel_date TEXT UNIQUE NOT NULL
        )
        """
    )
    columns = [row[1] for row in db.execute("PRAGMA table_info(bookings)").fetchall()]
    if "cancellation_reason" not in columns:
        db.execute("ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT")
    if "requested_cancellation_reason" not in columns:
        db.execute("ALTER TABLE bookings ADD COLUMN requested_cancellation_reason TEXT")
    db.commit()


def row_to_booking(row):
    return {
        "id": row["id"],
        "passenger_name": row["passenger_name"],
        "phone": row["phone"],
        "passport": row["passport"],
        "travel_date": row["travel_date"],
        "origin": row["origin"],
        "destination": row["destination"],
        "status": row["status"],
        "requested_status": row["requested_status"],
        "cancellation_reason": row["cancellation_reason"],
        "requested_cancellation_reason": row["requested_cancellation_reason"],
        "locked": bool(row["locked"]),
        "change_requested": bool(row["change_requested"]),
        "approval_granted": bool(row["approval_granted"]),
        "guest": bool(row["guest"]),
        "timestamp": row["timestamp"],
    }


def get_admin_user(username):
    db = get_db()
    return db.execute("SELECT * FROM admin_users WHERE username = ?", (username,)).fetchone()


def get_client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def is_rate_limited(ip):
    now = int(time.time())
    window_start = now - BOOKING_RATE_WINDOW_SECONDS
    request_times = booking_request_log.get(ip, [])
    request_times = [t for t in request_times if t >= window_start]
    if len(request_times) >= BOOKING_RATE_LIMIT:
        booking_request_log[ip] = request_times
        return True
    request_times.append(now)
    booking_request_log[ip] = request_times
    return False


def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split("Bearer ")[1]
    return TOKENS.get(token)


def require_token():
    return get_current_user()


def require_csrf_token():
    csrf_token = request.headers.get("X-CSRF-Token")
    x_requested_with = request.headers.get("X-Requested-With")
    if csrf_token == "1" or x_requested_with == "XMLHttpRequest":
        return True
    return False


with app.app_context():
    init_db()


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    client_ip = get_client_ip()
    if is_rate_limited(client_ip):
        return jsonify({"message": "تم تجاوز الحد المسموح لعدد الطلبات. حاول مرة أخرى بعد قليل."}), 429

    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400

    data = request.get_json()
    passenger_name = data.get("passengerName")
    phone = data.get("phone")
    passport = data.get("passport")
    travel_date = data.get("travelDate")
    origin = data.get("origin")
    destination = data.get("destination")
    guest = data.get("guest", False)

    if not all([passenger_name, phone, passport, travel_date, origin, destination]):
        return jsonify({"message": "جميع الحقول مطلوبة."}), 400

    if origin == destination:
        return jsonify({"message": "يجب أن تكون الوجهة مختلفة عن نقطة الانطلاق."}), 400

    booking_id = secrets.token_hex(8)
    db = get_db()
    db.execute(
        "INSERT INTO bookings (id, passenger_name, phone, passport, travel_date, origin, destination, status, requested_status, cancellation_reason, requested_cancellation_reason, locked, change_requested, approval_granted, guest, timestamp)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            booking_id,
            passenger_name,
            phone,
            passport,
            travel_date,
            origin,
            destination,
            "pending",
            None,
            None,
            None,
            0,
            0,
            0,
            int(bool(guest)),
            int(time.time() * 1000),
        ),
    )
    db.commit()

    print("[ADMIN NOTIFICATION] New guest booking request received:")
    print(f"  ID: {booking_id}")
    print(f"  Passenger: {passenger_name}")
    print(f"  Phone: {phone}")
    print(f"  Passport: {passport}")
    print(f"  Travel date: {travel_date}")
    print(f"  From: {origin}")
    print(f"  To: {destination}")
    print("  Status: pending")
    print(f"  Guest user: {guest}")

    return jsonify({"message": "Booking request received."}), 201


@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "اسم المستخدم وكلمة المرور مطلوبان."}), 400

    row = get_admin_user(username)
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"message": "اسم المستخدم أو كلمة المرور غير صحيحة."}), 401

    token = secrets.token_hex(16)
    TOKENS[token] = {"username": username, "role": row["role"]}
    return jsonify({"token": token, "role": row["role"], "username": username}), 200


@app.route("/api/admin/users", methods=["GET"])
def list_admin_users():
    current_user = require_token()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if current_user["role"] != "manager":
        return jsonify({"message": "يجب أن يكون المدير للوصول إلى هذه البيانات."}), 403

    db = get_db()
    rows = db.execute("SELECT username, role FROM admin_users ORDER BY username ASC").fetchall()
    users = [{"username": row["username"], "role": row["role"]} for row in rows]
    return jsonify({"users": users}), 200


@app.route("/api/admin/users", methods=["POST"])
def create_admin_user():
    current_user = require_token()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    if current_user["role"] != "manager":
        return jsonify({"message": "يجب أن يكون المدير لإنشاء مستخدم جديد."}), 403

    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or role not in {"manager", "employee"}:
        return jsonify({"message": "الرجاء إدخال اسم مستخدم وكلمة مرور ودور صالح."}), 400

    db = get_db()
    existing = db.execute("SELECT 1 FROM admin_users WHERE username = ?", (username,)).fetchone()
    if existing:
        return jsonify({"message": "اسم المستخدم موجود بالفعل."}), 400

    db.execute(
        "INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)",
        (username, generate_password_hash(password), role),
    )
    db.commit()
    return jsonify({"message": "تم إنشاء المستخدم بنجاح."}), 201


@app.route("/api/bookings", methods=["GET"])
def get_bookings():
    if not require_token():
        return jsonify({"message": "Unauthorized."}), 401

    db = get_db()
    rows = db.execute("SELECT * FROM bookings ORDER BY timestamp DESC").fetchall()
    bookings = [row_to_booking(row) for row in rows]
    return jsonify({"bookings": bookings}), 200

@app.route("/api/schedules", methods=["GET"])
def get_schedules():
    db = get_db()
    rows = db.execute("SELECT id, travel_date FROM schedules ORDER BY travel_date ASC").fetchall()
    dates = [{"id": r["id"], "travelDate": r["travel_date"]} for r in rows]
    return jsonify({"dates": dates}), 200

@app.route("/api/schedules", methods=["POST"])
def create_schedule():
    # Require manager token
    current_user = require_token()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    if current_user.get("role") != "manager":
        return jsonify({"message": "يجب أن يكون المدير لإضافة جدول الرحلات."}), 403

    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400
    data = request.get_json()
    travel_date = data.get("travelDate")
    if not travel_date:
        return jsonify({"message": "travelDate is required."}), 400
    db = get_db()
    try:
        cur = db.execute("INSERT OR IGNORE INTO schedules (travel_date) VALUES (?)", (travel_date,))
        db.commit()
        # fetch inserted id
        row = db.execute("SELECT id, travel_date FROM schedules WHERE travel_date = ?", (travel_date,)).fetchone()
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    return jsonify({"message": "Schedule added.", "schedule": {"id": row["id"], "travelDate": row["travel_date"]}}), 201


@app.route("/api/schedules/<int:schedule_id>", methods=["DELETE"])
def delete_schedule(schedule_id: int):
    current_user = require_token()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    if current_user.get("role") != "manager":
        return jsonify({"message": "يجب أن يكون المدير لحذف جدول الرحلات."}), 403
    db = get_db()
    row = db.execute("SELECT id FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
    if not row:
        return jsonify({"message": "Schedule not found."}), 404
    db.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
    db.commit()
    return jsonify({"message": "Schedule deleted."}), 200


@app.route("/api/bookings/<booking_id>", methods=["PATCH"])
def update_booking_status(booking_id: str):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    role = current_user["role"]

    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400

    data = request.get_json()
    status = data.get("status")
    cancellation_reason = data.get("cancellationReason")
    if status not in VALID_STATUSES:
        return jsonify({"message": "Invalid status."}), 400

    db = get_db()
    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not row:
        return jsonify({"message": "Booking not found."}), 404

    booking = row_to_booking(row)
    if role != "manager" and booking["status"] != "pending":
        return jsonify({"message": "يمكن للموظف العادي تغيير حالة الحجز فقط إذا كانت معلقة."}), 403

    if status == "cancelled" and role != "manager" and not cancellation_reason:
        return jsonify({"message": "يجب إضافة سبب الإلغاء."}), 400

    db.execute(
        "UPDATE bookings SET status = ?, locked = ?, change_requested = ?, approval_granted = ?, requested_status = ?, cancellation_reason = ? WHERE id = ?",
        (status, int(status != "pending"), 0, 0, None, cancellation_reason if status == "cancelled" else None, booking_id),
    )
    db.commit()

    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    booking = row_to_booking(row)
    print(f"[ADMIN UPDATE] Booking {booking_id} status changed to {status}.")
    return jsonify({"booking": booking}), 200


@app.route("/api/bookings/<booking_id>/request-change", methods=["POST"])
def request_booking_change(booking_id: str):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    role = current_user["role"]

    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400

    data = request.get_json()
    requested_status = data.get("requested_status")
    requested_cancellation_reason = data.get("requested_cancellation_reason")
    if requested_status not in {"confirmed", "cancelled"}:
        return jsonify({"message": "يجب طلب حالة صحيحة: تم الحجز أو ملغي."}), 400

    if requested_status == "cancelled" and not requested_cancellation_reason:
        return jsonify({"message": "يجب إضافة سبب الإلغاء عند طلب إلغاء."}), 400

    db = get_db()
    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not row:
        return jsonify({"message": "Booking not found."}), 404

    booking = row_to_booking(row)
    if booking["status"] == requested_status:
        return jsonify({"message": "الحالة المطلوبة هي نفس الحالة الحالية."}), 400

    db.execute(
        "UPDATE bookings SET change_requested = ?, requested_status = ?, requested_cancellation_reason = ?, approval_granted = ? WHERE id = ?",
        (1, requested_status, requested_cancellation_reason if requested_status == "cancelled" else None, 0, booking_id),
    )
    db.commit()

    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    booking = row_to_booking(row)
    return jsonify({"booking": booking, "message": "تم طلب موافقة المسؤول لتغيير الحالة."}), 200


@app.route("/api/bookings/<booking_id>/approve-change", methods=["POST"])
def approve_booking_change(booking_id: str):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    if current_user["role"] != "manager":
        return jsonify({"message": "يجب أن يقوم المدير بالموافقة على التغيير."}), 403

    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400

    data = request.get_json()
    password = data.get("password")
    if not password:
        return jsonify({"message": "كلمة المرور مطلوبة."}), 400

    admin_row = get_admin_user(current_user["username"])
    if not admin_row or not check_password_hash(admin_row["password_hash"], password):
        return jsonify({"message": "كلمة المرور غير صحيحة."}), 401

    db = get_db()
    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not row:
        return jsonify({"message": "Booking not found."}), 404

    booking = row_to_booking(row)
    if not booking["change_requested"] or not booking["requested_status"]:
        return jsonify({"message": "لا يوجد طلب تغيير حالة معلق."}), 400

    db.execute(
        "UPDATE bookings SET status = ?, locked = ?, change_requested = ?, approval_granted = ?, requested_status = ?, cancellation_reason = ?, requested_cancellation_reason = ? WHERE id = ?",
        (
            booking["requested_status"],
            int(booking["requested_status"] != "pending"),
            0,
            0,
            None,
            booking["requested_status"] == "cancelled" and booking.get("requested_cancellation_reason") or None,
            None,
            booking_id,
        ),
    )
    db.commit()

    row = db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    booking = row_to_booking(row)
    return jsonify({"booking": booking, "message": "تمت الموافقة على تغيير الحالة."}), 200


@app.route("/")
def index():
    if not DIST_DIR.exists():
        abort(500, description="Build the frontend first with 'npm run build'.")
    return send_from_directory(DIST_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename: str):
    if not DIST_DIR.exists():
        abort(500, description="Build the frontend first with 'npm run build'.")
    if (DIST_DIR / filename).exists():
        return send_from_directory(DIST_DIR, filename)
    return send_from_directory(DIST_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
