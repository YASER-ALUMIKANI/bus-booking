import logging
import os
import re
from pathlib import Path
import secrets
import sqlite3
import time
from flask import Flask, send_from_directory, abort, request, jsonify, g, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "app.db"
DIST_DIR = BASE_DIR / "dist"

app = Flask(__name__, static_folder=str(DIST_DIR / "assets"), static_url_path="/assets")
_default_secret = "yemenbus-dev-secret-key-change-in-production-2026"
app.secret_key = os.environ.get("SECRET_KEY", _default_secret)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

BOOKING_RATE_LIMIT = 15
BOOKING_RATE_WINDOW_SECONDS = 60
booking_request_log = {}

DEFAULT_ADMIN_USERS = {
    "manager": {"password": "admin123", "role": "manager"},
    "employee": {"password": "employee123", "role": "employee"},
}
TOKENS = {}

VALID_STATUSES = {"pending", "confirmed", "cancelled"}
VALID_COMPANIES = {"البركة", "المتصدر", "البراق"}
VALID_CITIES = {"البيضاء", "صنعاء", "عدن", "تعز", "الحديدة", "ذمار", "الرياض", "جدة", "الدمام", "أبها", "مكة"}
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_DIR = BASE_DIR / "uploads" / "passports"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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
    if "passport_image" not in columns:
        db.execute("ALTER TABLE bookings ADD COLUMN passport_image TEXT")
    db.commit()


def row_to_booking(row):
    passport_image = row["passport_image"] if "passport_image" in row.keys() else None
    return {
        "id": row["id"],
        "passenger_name": row["passenger_name"],
        "phone": row["phone"],
        "passport": row["passport"],
        "passport_image": passport_image,
        "passport_image_url": f"/uploads/passports/{passport_image}" if passport_image else None,
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


def get_client_user(phone):
    db = get_db()
    return db.execute("SELECT * FROM client_users WHERE phone = ?", (phone,)).fetchone()


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
    return csrf_token and csrf_token == session.get("csrf_token")


def get_or_create_csrf_token() -> str:
    csrf_token = session.get("csrf_token")
    if not csrf_token:
        csrf_token = secrets.token_hex(32)
        session["csrf_token"] = csrf_token
    return csrf_token


def allowed_image_filename(filename: str) -> bool:
    if not isinstance(filename, str) or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_IMAGE_EXTENSIONS


@app.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    return jsonify({"csrfToken": get_or_create_csrf_token()}), 200


def validate_passenger_name(name: str) -> bool:
    if not isinstance(name, str):
        return False
    name = name.strip()
    if len(name) < 3 or len(name) > 100:
        return False
    return bool(re.fullmatch(r"^[\u0600-\u06FF\u0621-\u064A\u0660-\u0669A-Za-z ]+$", name))


def validate_phone(phone: str) -> bool:
    if not isinstance(phone, str):
        return False
    phone = phone.strip()
    return bool(re.fullmatch(r"^[0-9]{7,15}$", phone))


def validate_password(password: str) -> bool:
    return isinstance(password, str) and 6 <= len(password) <= 128


def validate_passport(passport: str) -> bool:
    if not isinstance(passport, str):
        return False
    passport = passport.strip()
    return bool(re.fullmatch(r"^[A-Za-z0-9-]{5,20}$", passport))


def validate_travel_date(value: str) -> bool:
    if not isinstance(value, str):
        return False
    try:
        from datetime import datetime
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def validate_company(company: str) -> bool:
    return isinstance(company, str) and company.strip() in VALID_COMPANIES


def validate_city(city: str) -> bool:
    return isinstance(city, str) and city.strip() in VALID_CITIES


def travel_date_available(travel_date: str) -> bool:
    db = get_db()
    row = db.execute(
        "SELECT 1 FROM schedules WHERE travel_date = ?",
        (travel_date,),
    ).fetchone()
    return row is not None


with app.app_context():
    init_db()


@app.route("/api/client/register", methods=["POST"])
def client_register():
    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    data = request.get_json()
    phone = data.get("phone", "")
    password = data.get("password", "")

    if not validate_phone(phone):
        return jsonify({"message": "رقم الجوال غير صالح. يجب أن يحتوي على 7 إلى 15 رقماً."}), 400
    if not validate_password(password):
        return jsonify({"message": "كلمة المرور يجب أن تكون بين 6 و128 حرفاً."}), 400

    db = get_db()
    existing = get_client_user(phone)
    if existing:
        return jsonify({"message": "رقم الجوال موجود بالفعل. سجل الدخول أو استخدم رقماً آخر."}), 400

    db.execute(
        "INSERT INTO client_users (phone, password_hash, created_at) VALUES (?, ?, ?)",
        (phone, generate_password_hash(password), int(time.time() * 1000)),
    )
    db.commit()
    return jsonify({"message": "تم إنشاء الحساب بنجاح.", "phone": phone}), 201


@app.route("/api/client/login", methods=["POST"])
def client_login():
    if not request.is_json:
        return jsonify({"message": "Invalid request payload."}), 400
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    data = request.get_json()
    phone = data.get("phone", "")
    password = data.get("password", "")

    if not validate_phone(phone) or not validate_password(password):
        return jsonify({"message": "رقم الجوال أو كلمة المرور غير صحيحة."}), 401

    row = get_client_user(phone)
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"message": "رقم الجوال أو كلمة المرور غير صحيحة."}), 401

    return jsonify({"message": "تم تسجيل الدخول بنجاح.", "phone": phone}), 200


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    client_ip = get_client_ip()
    if is_rate_limited(client_ip):
        return jsonify({"message": "تم تجاوز الحد المسموح لعدد الطلبات. حاول مرة أخرى بعد قليل."}), 429

    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    passport_image_file = None
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        form = request.form
        passport_image_file = request.files.get("passportImage")
        passenger_name = form.get("passengerName")
        phone = form.get("phone")
        passport = form.get("passport")
        travel_date = form.get("travelDate")
        origin = form.get("origin")
        destination = form.get("destination")
        company = form.get("company")
        guest = form.get("guest", False)
    elif request.is_json:
        data = request.get_json()
        passenger_name = data.get("passengerName")
        phone = data.get("phone")
        passport = data.get("passport")
        travel_date = data.get("travelDate")
        origin = data.get("origin")
        destination = data.get("destination")
        company = data.get("company")
        guest = data.get("guest", False)
    else:
        return jsonify({"message": "Invalid request payload."}), 400

    if not all([passenger_name, phone, passport, travel_date, origin, destination, company]):
        return jsonify({"message": "جميع الحقول مطلوبة."}), 400

    origin = origin.strip()
    destination = destination.strip()
    company = company.strip()

    if origin == destination:
        return jsonify({"message": "يجب أن تكون الوجهة مختلفة عن نقطة الانطلاق."}), 400

    if not validate_company(company):
        return jsonify({"message": "شركة النقل غير صالحة."}), 400

    if not validate_city(origin) or not validate_city(destination):
        return jsonify({"message": "مكان الانطلاق أو الوجهة غير صالح."}), 400

    if not validate_passenger_name(passenger_name):
        return jsonify({"message": "اسم المسافر غير صالح. استخدم حروفاً ومسافات فقط، بين 3 و100 حرف."}), 400
    if not validate_phone(phone):
        return jsonify({"message": "رقم الجوال غير صالح. يجب أن يحتوي على 7 إلى 15 رقماً."}), 400
    if not validate_passport(passport):
        return jsonify({"message": "رقم الجواز غير صالح. استخدم أحرفاً وأرقاماً فقط، بين 5 و20 حرفاً."}), 400
    if not validate_travel_date(travel_date):
        return jsonify({"message": "تاريخ المغادرة غير صالح. استخدم الصيغة yyyy-mm-dd."}), 400

    if not passport_image_file:
        return jsonify({"message": "يرجى رفع صورة جواز السفر."}), 400
    if not allowed_image_filename(passport_image_file.filename):
        return jsonify({"message": "صيغة صورة الجواز غير مدعومة. استخدم JPG أو PNG أو WEBP."}), 400

    if not travel_date_available(travel_date):
        return jsonify({"message": "تاريخ المغادرة غير متاح. اختر تاريخاً من التقويم المصرح به."}), 400

    booking_id = secrets.token_hex(8)
    filename = secure_filename(passport_image_file.filename)
    extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
    passport_image_filename = f"{booking_id}.{extension}"
    passport_image_path = UPLOAD_DIR / passport_image_filename
    passport_image_file.save(passport_image_path)
    db = get_db()
    db.execute(
        "INSERT INTO bookings (id, passenger_name, phone, passport, passport_image, travel_date, origin, destination, status, requested_status, cancellation_reason, requested_cancellation_reason, locked, change_requested, approval_granted, guest, timestamp)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            booking_id,
            passenger_name,
            phone,
            passport,
            passport_image_filename,
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

    logger.info("[ADMIN NOTIFICATION] New guest booking request received:")
    logger.info("  ID: %s", booking_id)
    logger.info("  Passenger: %s", passenger_name)
    logger.info("  Phone: %s", phone)
    logger.info("  Passport: %s", passport)
    logger.info("  Travel date: %s", travel_date)
    logger.info("  From: %s", origin)
    logger.info("  To: %s", destination)
    ticket_number = f"T-{booking_id}"

    logger.info("  Status: pending")
    logger.info("  Guest user: %s", guest)
    logger.info("  Ticket number: %s", ticket_number)

    return jsonify({"message": "Booking request received.", "ticketNumber": ticket_number}), 201


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

@app.route('/uploads/passports/<path:filename>')
def serve_passport_image(filename: str):
    return send_from_directory(UPLOAD_DIR, filename)

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
    logger.info("[ADMIN UPDATE] Booking %s status changed to %s.", booking_id, status)
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
