from flask import Blueprint, request, jsonify, session
import secrets
import time
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database.db import get_db, require_csrf_token, get_or_create_csrf_token
from backend.validators.auth_validator import validate_phone, validate_password
from backend.services.auth_service import get_client_user, get_admin_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/csrf-token", methods=["GET"])
def get_csrf_token():
    return jsonify({"csrfToken": get_or_create_csrf_token()}), 200

@auth_bp.route("/api/client/register", methods=["POST"])
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

@auth_bp.route("/api/client/login", methods=["POST"])
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

@auth_bp.route("/api/client/logout", methods=["POST"])
def client_logout():
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    session.pop("client_phone", None)
    return jsonify({"message": "تم تسجيل الخروج بنجاح."}), 200

@auth_bp.route("/api/client/status", methods=["GET"])
def get_client_status():
    phone = session.get("client_phone")
    if not phone:
        return jsonify({"isLoggedIn": False}), 200

    db = get_db()
    client = get_client_user(phone)
    if not client:
        return jsonify({"isLoggedIn": False}), 200

    row = db.execute(
        "SELECT status, fullname, identity_type, identity_number, issue_date, issue_place, identity_image FROM verification_requests WHERE phone = ?",
        (phone,)
    ).fetchone()

    status = row["status"] if row else "unverified"
    fullname = row["fullname"] if row else None
    
    return jsonify({
        "isLoggedIn": True,
        "phone": phone,
        "verificationStatus": status,
        "fullname": fullname,
        "details": {
            "fullname": row["fullname"],
            "identityType": row["identity_type"],
            "identityNumber": row["identity_number"],
            "issueDate": row["issue_date"],
            "issuePlace": row["issue_place"],
            "identityImage": row["identity_image"],
            "identityImageUrl": f"/uploads/verifications/{row['identity_image']}" if row else None
        } if row else None
    }), 200

@auth_bp.route("/api/client/delete-account", methods=["POST"])
def client_delete_account():
    phone = session.get("client_phone")
    if not phone:
        return jsonify({"message": "يرجى تسجيل الدخول أولاً."}), 401

    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    db = get_db()
    try:
        db.execute("DELETE FROM verification_requests WHERE phone = ?", (phone,))
        db.execute("DELETE FROM bookings WHERE phone = ?", (phone,))
        db.execute("DELETE FROM client_users WHERE phone = ?", (phone,))
        db.commit()
        session.pop("client_phone", None)
        return jsonify({"message": "تم حذف الحساب بنجاح وكل البيانات المرتبطة به."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": "حدث خطأ أثناء حذف الحساب. يرجى المحاولة لاحقاً."}), 500

@auth_bp.route("/api/admin/login", methods=["POST"])
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
    db = get_db()
    db.execute(
        "INSERT INTO admin_tokens (token, username, role, created_at) VALUES (?, ?, ?, ?)",
        (token, username, row["role"], int(time.time()))
    )
    db.commit()
    return jsonify({"token": token, "role": row["role"], "username": username}), 200
