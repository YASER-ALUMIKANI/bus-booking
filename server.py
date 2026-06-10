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
from PIL import Image

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
VALID_COMPANIES = {"البركة", "المتصدر", "البراق", "إكسبرس"}
VALID_CITIES = {"البيضاء", "صنعاء", "عدن", "تعز", "الحديدة", "ذمار", "الرياض", "جدة", "الدمام", "أبها", "مكة", "إب", "نجران"}
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

# Dangerous extensions that must never appear anywhere in the filename
DANGEROUS_EXTENSIONS = {
    "php", "php3", "php4", "php5", "phtml", "phar",
    "asp", "aspx", "asa", "asax",
    "jsp", "jspx",
    "py", "rb", "pl", "sh", "bash", "cgi",
    "exe", "dll", "bat", "cmd", "ps1",
    "htaccess", "htpasswd",
    "svg", "xml", "html", "htm",  # can contain scripts
}

# Real image magic bytes: (offset, signature_bytes)
IMAGE_MAGIC: dict[str, list[tuple[int, bytes]]] = {
    "jpg":  [(0, b"\xff\xd8\xff")],
    "jpeg": [(0, b"\xff\xd8\xff")],
    "png":  [(0, b"\x89PNG\r\n\x1a\n")],
    "webp": [(0, b"RIFF"), (8, b"WEBP")],
}

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
            travel_date TEXT NOT NULL,
            company TEXT NOT NULL,
            UNIQUE(travel_date, company)
        )
        """
    )
    schedules_cols = [row[1] for row in db.execute("PRAGMA table_info(schedules)").fetchall()]
    if "company" not in schedules_cols:
        # Check if table already has data/exists
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
        "bus_type": "TEXT"
    }
    for col_name, col_type in new_booking_cols.items():
        if col_name not in columns:
            db.execute(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_type}")

    db.commit()


def row_to_booking(row):
    passport_image = row["passport_image"] if "passport_image" in row.keys() else None
    keys = row.keys()
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
        "company": row["company"] if "company" in keys else None,
        "seat": row["seat"] if "seat" in keys else None,
        "dob": row["dob"] if "dob" in keys else None,
        "trip_time": row["trip_time"] if "trip_time" in keys else None,
        "arrival_time": row["arrival_time"] if "arrival_time" in keys else None,
        "day_of_week": row["day_of_week"] if "day_of_week" in keys else None,
        "issuing_office": row["issuing_office"] if "issuing_office" in keys else None,
        "price": row["price"] if "price" in keys else None,
        "notes": row["notes"] if "notes" in keys else None,
        "bus_type": row["bus_type"] if "bus_type" in keys else None,
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
    parts = filename.lower().split(".")
    # Reject double extensions containing dangerous keywords
    for segment in parts[:-1]:
        if segment in DANGEROUS_EXTENSIONS:
            return False
    extension = parts[-1]
    return extension in ALLOWED_IMAGE_EXTENSIONS


def verify_image_magic(file_storage) -> bool:
    """Uses PIL to open and verify the image contents and boundaries."""
    try:
        # Save current position
        pos = file_storage.stream.tell()
    except Exception:
        pos = 0
    try:
        # PIL open and verify
        img = Image.open(file_storage.stream)
        img.verify()
        
        # Seek back and reopen to check size
        file_storage.stream.seek(pos)
        img = Image.open(file_storage.stream)
        if img.width > 5000 or img.height > 5000:
            file_storage.stream.seek(pos)
            return False
            
        file_storage.stream.seek(pos)
        return True
    except Exception:
        try:
            file_storage.stream.seek(pos)
        except Exception:
            pass
        return False


@app.errorhandler(413)
def request_entity_too_large(error):
    max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
    return jsonify({"message": f"حجم الملف كبير جداً. الحد الأقصى المسموح به هو {max_mb} ميغابايت."}), 413


@app.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    return jsonify({"csrfToken": get_or_create_csrf_token()}), 200


def calculate_arrival_time(trip_time_str: str) -> str:
    from datetime import datetime, timedelta
    for fmt in ("%I:%M:%S %p", "%I:%M %p", "%H:%M:%S", "%H:%M"):
        try:
            dt = datetime.strptime(trip_time_str.strip(), fmt)
            arrival_dt = dt - timedelta(hours=1)
            return arrival_dt.strftime(fmt)
        except ValueError:
            continue
    return "05:30:00 PM"


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
    session["client_phone"] = phone
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

    session["client_phone"] = row["phone"]
    return jsonify({"message": "تم تسجيل الدخول بنجاح.", "phone": row["phone"]}), 200


@app.route("/api/client/bookings", methods=["GET"])
def get_client_bookings():
    phone = session.get("client_phone")
    if not phone:
        return jsonify({"message": "يرجى تسجيل الدخول أولاً."}), 401

    db = get_db()
    rows = db.execute("SELECT * FROM bookings WHERE phone = ? ORDER BY timestamp DESC", (phone,)).fetchall()
    bookings = [row_to_booking(row) for row in rows]
    return jsonify({"bookings": bookings}), 200


@app.route("/api/client/logout", methods=["POST"])
def client_logout():
    session.pop("client_phone", None)
    return jsonify({"message": "تم تسجيل الخروج بنجاح."}), 200


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
        seat = form.get("seat")
        dob = form.get("dob")
        trip_time = form.get("tripTime")
        arrival_time = form.get("arrivalTime")
        issuing_office = form.get("issuingOffice")
        notes = form.get("notes")
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
        seat = data.get("seat")
        dob = data.get("dob")
        trip_time = data.get("tripTime")
        arrival_time = data.get("arrivalTime")
        issuing_office = data.get("issuingOffice")
        notes = data.get("notes")
        guest = data.get("guest", False)
    else:
        return jsonify({"message": "Invalid request payload."}), 400

    if not all([passenger_name, phone, passport, travel_date, origin, destination, company, seat, dob]):
        return jsonify({"message": "جميع الحقول مطلوبة."}), 400

    origin = origin.strip()
    destination = destination.strip()
    company = company.strip()
    dob = dob.strip()

    try:
        seat = int(seat)
    except (ValueError, TypeError):
        return jsonify({"message": "رقم المقعد يجب أن يكون رقماً صحيحاً."}), 400

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
    if not verify_image_magic(passport_image_file):
        return jsonify({"message": "الملف المرفوع ليس صورة حقيقية. يُسمح فقط بصور JPG أو PNG أو WEBP."}), 400

    db = get_db()
    
    # Get schedule details
    schedule = db.execute("SELECT id, price, bus_type, total_seats, trip_time, notes, issuing_office FROM schedules WHERE travel_date = ? AND company = ?", (travel_date, company)).fetchone()
    if not schedule:
        return jsonify({"message": "تاريخ المغادرة أو شركة النقل غير متاحة في الجدول."}), 400

    price = schedule["price"]
    bus_type = schedule["bus_type"]
    total_seats = schedule["total_seats"]
    trip_time = schedule["trip_time"]
    notes = schedule["notes"]
    issuing_office = schedule["issuing_office"]
    arrival_time = calculate_arrival_time(trip_time)

    if seat < 1 or seat > total_seats:
        return jsonify({"message": f"رقم المقعد غير صالح. يجب أن يكون بين 1 و {total_seats}."}), 400

    # Check seat availability
    already_booked = db.execute("SELECT 1 FROM bookings WHERE travel_date = ? AND company = ? AND seat = ? AND status != 'cancelled'", (travel_date, company, seat)).fetchone()
    if already_booked:
        return jsonify({"message": "عذراً، هذا المقعد محجوز بالفعل. الرجاء اختيار مقعد آخر."}), 400

    # Calculate day of week
    from datetime import datetime
    days_ar = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    try:
        dt = datetime.strptime(travel_date, "%Y-%m-%d")
        day_of_week = days_ar[dt.weekday()]
    except Exception:
        day_of_week = "الاثنين"

    booking_id = secrets.token_hex(8)
    filename = secure_filename(passport_image_file.filename)
    extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
    passport_image_filename = f"{booking_id}.{extension}"
    passport_image_path = UPLOAD_DIR / passport_image_filename
    passport_image_file.save(passport_image_path)
    
    db.execute(
        "INSERT INTO bookings (id, passenger_name, phone, passport, passport_image, travel_date, origin, destination, status, requested_status, cancellation_reason, requested_cancellation_reason, locked, change_requested, approval_granted, guest, timestamp, company, seat, dob, trip_time, arrival_time, day_of_week, issuing_office, price, notes, bus_type)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            company,
            seat,
            dob,
            trip_time,
            arrival_time,
            day_of_week,
            issuing_office,
            price,
            notes,
            bus_type,
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

    return jsonify({
        "message": "Booking request received.",
        "ticketNumber": ticket_number,
        "dayOfWeek": day_of_week,
        "price": price,
        "busType": bus_type
    }), 201


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
    rows = db.execute("SELECT id, travel_date, company, price, bus_type, total_seats, trip_time, notes, issuing_office FROM schedules ORDER BY travel_date ASC").fetchall()
    dates = [{
        "id": r["id"],
        "travelDate": r["travel_date"],
        "company": r["company"],
        "price": r["price"],
        "busType": r["bus_type"],
        "totalSeats": r["total_seats"],
        "tripTime": r["trip_time"],
        "notes": r["notes"],
        "issuingOffice": r["issuing_office"]
    } for r in rows]
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
    company = data.get("company")
    price = data.get("price", 35000)
    bus_type = data.get("busType", "VIP")
    total_seats = data.get("totalSeats", 40)
    trip_time = data.get("tripTime", "06:30:00 PM")
    notes = data.get("notes", "الصعود من عفار")
    issuing_office = data.get("issuingOffice", "وكيل اب مساعد كامل")
 
    if not travel_date or not company:
        return jsonify({"message": "travelDate and company are required."}), 400
    if not validate_company(company):
        return jsonify({"message": "شركة النقل غير صالحة."}), 400
    
    try:
        price = int(price)
        total_seats = int(total_seats)
        if price <= 0 or total_seats <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"message": "السعر وعدد المقاعد يجب أن تكون أرقاماً موجبة."}), 400
 
    if bus_type not in {"VIP", "عادي"}:
        return jsonify({"message": "نوع الباص غير صالح."}), 400
 
    if not isinstance(trip_time, str) or not trip_time.strip():
        return jsonify({"message": "وقت الرحلة غير صالح."}), 400
    trip_time = trip_time.strip()

    if not isinstance(notes, str) or not notes.strip():
        return jsonify({"message": "الملاحظات غير صالحة."}), 400
    notes = notes.strip()

    if not isinstance(issuing_office, str) or not issuing_office.strip():
        return jsonify({"message": "مكتب الإصدار غير صالح."}), 400
    issuing_office = issuing_office.strip()
 
    db = get_db()
    try:
        cur = db.execute(
            "INSERT OR IGNORE INTO schedules (travel_date, company, price, bus_type, total_seats, trip_time, notes, issuing_office) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (travel_date, company, price, bus_type, total_seats, trip_time, notes, issuing_office)
        )
        db.commit()
        # fetch inserted id
        row = db.execute("SELECT id, travel_date, company, price, bus_type, total_seats, trip_time, notes, issuing_office FROM schedules WHERE travel_date = ? AND company = ?", (travel_date, company)).fetchone()
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    return jsonify({
        "message": "Schedule added.",
        "schedule": {
            "id": row["id"],
            "travelDate": row["travel_date"],
            "company": row["company"],
            "price": row["price"],
            "busType": row["bus_type"],
            "totalSeats": row["total_seats"],
            "tripTime": row["trip_time"],
            "notes": row["notes"],
            "issuingOffice": row["issuing_office"]
        }
    }), 201

@app.route("/api/schedules/<int:schedule_id>/booked-seats", methods=["GET"])
def get_booked_seats(schedule_id: int):
    db = get_db()
    schedule = db.execute("SELECT travel_date, company FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
    if not schedule:
        return jsonify({"message": "Schedule not found."}), 404
    
    rows = db.execute(
        "SELECT seat FROM bookings WHERE travel_date = ? AND company = ? AND status != 'cancelled'",
        (schedule["travel_date"], schedule["company"])
    ).fetchall()
    booked_seats = [r["seat"] for r in rows if r["seat"] is not None]
    return jsonify({"bookedSeats": booked_seats}), 200


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
