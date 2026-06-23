import time
import secrets
import logging
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash
from backend.database.db import get_db, require_csrf_token, UPLOAD_DIR, PAYMENT_UPLOAD_DIR, DB_FILE
from backend.validators.booking_validator import (
    validate_passenger_name, validate_passport,
    validate_travel_date, validate_company, validate_city
)
from backend.validators.auth_validator import validate_phone
from backend.validators.image_validator import allowed_image_filename, verify_image_magic
from backend.services.booking_service import get_client_ip, is_rate_limited, row_to_booking
from backend.services.auth_service import get_current_user, get_admin_user, require_token
from backend.services.schedule_service import calculate_arrival_time

logger = logging.getLogger(__name__)
bookings_bp = Blueprint("bookings", __name__)

VALID_STATUSES = {"pending", "confirmed", "cancelled"}

@bookings_bp.route("/api/client/bookings", methods=["GET"])
def get_client_bookings():
    phone = session.get("client_phone")
    if not phone:
        return jsonify({"message": "يرجى تسجيل الدخول أولاً."}), 401

    db = get_db()
    rows = db.execute("SELECT * FROM bookings WHERE phone = ? ORDER BY timestamp DESC", (phone,)).fetchall()
    bookings = [row_to_booking(row) for row in rows]
    return jsonify({"bookings": bookings}), 200

@bookings_bp.route("/api/bookings", methods=["POST"])
def create_booking():
    client_ip = get_client_ip()
    if is_rate_limited(client_ip):
        return jsonify({"message": "تم تجاوز الحد المسموح لعدد الطلبات. حاول مرة أخرى بعد قليل."}), 429

    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

    passport_image_file = None
    payment_image_file = None
    passenger_type = "adult"
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        form = request.form
        passport_image_file = request.files.get("passportImage")
        payment_image_file = request.files.get("paymentImage")
        passenger_name = form.get("passengerName")
        phone = form.get("phone")
        passport = form.get("passport")
        travel_date = form.get("travelDate")
        origin = form.get("origin")
        destination = form.get("destination")
        company = form.get("company")
        seat = form.get("seat")
        dob = form.get("dob")
        payment_ref = form.get("paymentRef")
        trip_time = form.get("tripTime")
        arrival_time = form.get("arrivalTime")
        issuing_office = form.get("issuingOffice")
        notes = form.get("notes")
        guest = form.get("guest", False)
        passenger_type = form.get("passengerType", "adult")
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
        payment_ref = data.get("paymentRef")
        trip_time = data.get("tripTime")
        arrival_time = data.get("arrivalTime")
        issuing_office = data.get("issuingOffice")
        notes = data.get("notes")
        guest = data.get("guest", False)
        passenger_type = data.get("passengerType", "adult")
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

    payment_ref = payment_ref.strip() if payment_ref else None

    if payment_image_file:
        if not allowed_image_filename(payment_image_file.filename):
            return jsonify({"message": "صيغة صورة إشعار الحوالة غير مدعومة. استخدم JPG أو PNG أو WEBP."}), 400
        if not verify_image_magic(payment_image_file):
            return jsonify({"message": "الملف المرفوع كإشعار تحويل ليس صورة حقيقية. يُسمح فقط بصور JPG أو PNG أو WEBP."}), 400

    db = get_db()
    
    # Get schedule details
    schedule = db.execute("SELECT id, price, price_adult, price_child, bus_type, total_seats, trip_time, notes, issuing_office FROM schedules WHERE travel_date = ? AND company = ?", (travel_date, company)).fetchone()
    if not schedule:
        return jsonify({"message": "تاريخ المغادرة أو شركة النقل غير متاحة في الجدول."}), 400

    price_adult = schedule["price_adult"] if "price_adult" in schedule.keys() else schedule["price"]
    price_child = schedule["price_child"] if "price_child" in schedule.keys() else schedule["price"]
    
    if passenger_type == "child":
        price = price_child
    else:
        price = price_adult
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

    payment_image_filename = None
    if payment_image_file:
        payment_filename = secure_filename(payment_image_file.filename)
        payment_extension = payment_filename.rsplit('.', 1)[1].lower() if '.' in payment_filename else 'jpg'
        payment_image_filename = f"{booking_id}_payment.{payment_extension}"
        payment_image_path = PAYMENT_UPLOAD_DIR / payment_image_filename
        payment_image_file.save(payment_image_path)
    
    db.execute(
        "INSERT INTO bookings (id, passenger_name, phone, passport, passport_image, travel_date, origin, destination, status, requested_status, cancellation_reason, requested_cancellation_reason, locked, change_requested, approval_granted, guest, timestamp, company, seat, dob, trip_time, arrival_time, day_of_week, issuing_office, price, notes, bus_type, payment_ref, payment_image)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
            payment_ref,
            payment_image_filename
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

@bookings_bp.route("/api/bookings", methods=["GET"])
def get_bookings():
    if not require_token():
        return jsonify({"message": "Unauthorized."}), 401

    db = get_db()
    rows = db.execute("SELECT * FROM bookings ORDER BY timestamp DESC").fetchall()
    bookings = [row_to_booking(row) for row in rows]
    
    db_size_bytes = DB_FILE.stat().st_size if DB_FILE.exists() else 0
    return jsonify({"bookings": bookings, "db_size": db_size_bytes}), 200

@bookings_bp.route("/api/bookings/<booking_id>", methods=["PATCH"])
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

@bookings_bp.route("/api/bookings/<booking_id>/request-change", methods=["POST"])
def request_booking_change(booking_id: str):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"message": "Unauthorized."}), 401
    if not require_csrf_token():
        return jsonify({"message": "CSRF token missing or invalid."}), 403

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

@bookings_bp.route("/api/bookings/<booking_id>/approve-change", methods=["POST"])
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
