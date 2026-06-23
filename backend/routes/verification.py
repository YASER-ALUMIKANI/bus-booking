import time
import logging
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from backend.database.db import get_db, require_csrf_token, VERIFICATION_UPLOAD_DIR
from backend.validators.image_validator import allowed_image_filename, verify_image_magic

logger = logging.getLogger(__name__)
verification_bp = Blueprint("verification", __name__)

@verification_bp.route("/api/client/verify", methods=["POST"])
def client_submit_verify():
    phone = session.get("client_phone")
    if not phone:
        return jsonify({"message": "يرجى تسجيل الدخول أولاً."}), 401

    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    db = get_db()
    existing = db.execute("SELECT status FROM verification_requests WHERE phone = ?", (phone,)).fetchone()
    if existing:
        if existing["status"] == "approved":
            return jsonify({"message": "الحساب موثق بالفعل."}), 400
        elif existing["status"] == "pending":
            return jsonify({"message": "طلب التوثيق قيد المراجعة حالياً."}), 400

    if not request.content_type or not request.content_type.startswith("multipart/form-data"):
        return jsonify({"message": "Invalid request payload."}), 400

    form = request.form
    fullname = form.get("fullname")
    identity_type = form.get("identityType")
    identity_number = form.get("identityNumber")
    issue_date = form.get("issueDate")
    issue_place = form.get("issuePlace")
    image_file = request.files.get("identityImage")

    if not all([fullname, identity_type, identity_number, issue_date, issue_place, image_file]):
        return jsonify({"message": "جميع الحقول مطلوبة."}), 400

    fullname = fullname.strip()
    identity_type = identity_type.strip()
    identity_number = identity_number.strip()
    issue_date = issue_date.strip()
    issue_place = issue_place.strip()

    if not allowed_image_filename(image_file.filename):
        return jsonify({"message": "يُسمح فقط بصور بصيغة JPG أو PNG أو WEBP."}), 400

    if not verify_image_magic(image_file):
        return jsonify({"message": "ملف الصورة غير صالح أو تالف."}), 400

    ext = image_file.filename.lower().split(".")[-1]
    filename = f"verify_{phone}_{int(time.time())}.{ext}"
    safe_name = secure_filename(filename)

    try:
        image_file.save(VERIFICATION_UPLOAD_DIR / safe_name)
        db.execute(
            """
            INSERT OR REPLACE INTO verification_requests 
            (phone, fullname, identity_type, identity_number, issue_date, issue_place, identity_image, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (phone, fullname, identity_type, identity_number, issue_date, issue_place, safe_name, int(time.time() * 1000))
        )
        db.commit()
    except Exception as e:
        logger.error("Error saving verification request: %s", str(e))
        return jsonify({"message": "حدث خطأ أثناء حفظ طلب التوثيق. حاول مرة أخرى."}), 500

    return jsonify({"message": "تم تقديم طلب التوثيق بنجاح وهو قيد المراجعة.", "status": "pending"}), 200
