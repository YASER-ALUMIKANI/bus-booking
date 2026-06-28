import logging
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from backend.database.db import get_db, require_csrf_token
from backend.services.auth_service import require_token, get_current_user

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/api/admin/users", methods=["GET"])
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

@admin_bp.route("/api/admin/users", methods=["POST"])
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

@admin_bp.route("/api/admin/verifications", methods=["GET"])
def list_verifications():
    if not require_token():
        return jsonify({"message": "Unauthorized."}), 401

    db = get_db()
    rows = db.execute("SELECT * FROM verification_requests ORDER BY created_at DESC").fetchall()
    requests_list = []
    for row in rows:
        requests_list.append({
            "id": row["id"],
            "phone": row["phone"],
            "fullname": row["fullname"],
            "identityType": row["identity_type"],
            "identityNumber": row["identity_number"],
            "issueDate": row["issue_date"],
            "issuePlace": row["issue_place"],
            "identityImage": row["identity_image"],
            "identityImageUrl": f"/uploads/verifications/{row['identity_image']}",
            "status": row["status"],
            "createdAt": row["created_at"]
        })
    return jsonify({"verifications": requests_list}), 200

@admin_bp.route("/api/admin/verifications/<int:request_id>/approve", methods=["POST"])
def approve_verification(request_id: int):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    if current_user["role"] != "manager":
        return jsonify({"message": "يجب أن يكون المدير للموافقة على توثيق الحساب."}), 403

    db = get_db()
    row = db.execute("SELECT phone FROM verification_requests WHERE id = ?", (request_id,)).fetchone()
    if not row:
        return jsonify({"message": "طلب التوثيق غير موجود."}), 404

    db.execute("UPDATE verification_requests SET status = 'approved' WHERE id = ?", (request_id,))
    db.commit()
    logger.info("[ADMIN APPROVE] Verification request %d approved for client %s.", request_id, row["phone"])
    return jsonify({"message": "تمت الموافقة على توثيق الحساب بنجاح."}), 200

@admin_bp.route("/api/admin/verifications/<int:request_id>/reject", methods=["POST"])
def reject_verification(request_id: int):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403
    if current_user["role"] != "manager":
        return jsonify({"message": "يجب أن يكون المدير لرفض توثيق الحساب."}), 403

    db = get_db()
    row = db.execute("SELECT phone FROM verification_requests WHERE id = ?", (request_id,)).fetchone()
    if not row:
        return jsonify({"message": "طلب التوثيق غير موجود."}), 404

    db.execute("UPDATE verification_requests SET status = 'rejected' WHERE id = ?", (request_id,))
    db.commit()
    logger.info("[ADMIN REJECT] Verification request %d rejected for client %s.", request_id, row["phone"])
    return jsonify({"message": "تم رفض طلب التوثيق."}), 200

# ponytail: Dangerous Zone endpoints - Manager Only
@admin_bp.route("/api/admin/danger/clear-db", methods=["POST"])
def danger_clear_db():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "manager":
        return jsonify({"message": "غير مصرح. يجب أن تكون المدير لتنفيذ هذا الإجراء الحساس."}), 403
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    db = get_db()
    try:
        db.execute("DELETE FROM bookings")
        db.execute("DELETE FROM schedules")
        db.commit()
        logger.warning("[DANGER ZONE] Database bookings and schedules cleared by manager.")
        return jsonify({"message": "تم تفريغ وتصفية جداول الحجوزات والرحلات بنجاح."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"حدث خطأ أثناء التصفية: {str(e)}"}), 500

@admin_bp.route("/api/admin/danger/clear-clients", methods=["POST"])
def danger_clear_clients():
    current_user = get_current_user()
    if not current_user or current_user["role"] != "manager":
        return jsonify({"message": "غير مصرح. يجب أن تكون المدير لتنفيذ هذا الإجراء الحساس."}), 403
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    db = get_db()
    try:
        db.execute("DELETE FROM client_users")
        db.execute("DELETE FROM verification_requests")
        db.execute("DELETE FROM bookings") # bookings depend on clients
        db.commit()
        logger.warning("[DANGER ZONE] All client accounts and related bookings cleared by manager.")
        return jsonify({"message": "تم حذف جميع حسابات العملاء والبيانات المرتبطة بهم بنجاح."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"حدث خطأ أثناء الحذف: {str(e)}"}), 500

@admin_bp.route("/api/admin/danger/delete-admin/<username>", methods=["DELETE"])
def danger_delete_admin(username: str):
    current_user = get_current_user()
    if not current_user or current_user["role"] != "manager":
        return jsonify({"message": "غير مصرح. يجب أن تكون المدير لتنفيذ هذا الإجراء الحساس."}), 403
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    if username == current_user["username"]:
        return jsonify({"message": "لا يمكنك حذف حسابك الحالي كمدير نظام."}), 400

    db = get_db()
    try:
        db.execute("DELETE FROM admin_users WHERE username = ?", (username,))
        db.commit()
        logger.warning("[DANGER ZONE] Admin user %s deleted by manager.", username)
        return jsonify({"message": f"تم حذف المشرف {username} بنجاح."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"حدث خطأ أثناء حذف المشرف: {str(e)}"}), 500
