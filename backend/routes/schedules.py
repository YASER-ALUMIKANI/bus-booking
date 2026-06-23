from flask import Blueprint, request, jsonify
from backend.database.db import get_db, require_csrf_token
from backend.validators.booking_validator import validate_company
from backend.services.auth_service import require_token

schedules_bp = Blueprint("schedules", __name__)

@schedules_bp.route("/api/schedules", methods=["GET"])
def get_schedules():
    db = get_db()
    rows = db.execute("SELECT id, travel_date, company, price, price_adult, price_child, bus_type, total_seats, trip_time, notes, issuing_office FROM schedules ORDER BY travel_date ASC").fetchall()
    dates = [{
        "id": r["id"],
        "travelDate": r["travel_date"],
        "company": r["company"],
        "price": r["price"],
        "priceAdult": r["price_adult"],
        "priceChild": r["price_child"],
        "busType": r["bus_type"],
        "totalSeats": r["total_seats"],
        "tripTime": r["trip_time"],
        "notes": r["notes"],
        "issuingOffice": r["issuing_office"]
    } for r in rows]
    return jsonify({"dates": dates}), 200

@schedules_bp.route("/api/schedules", methods=["POST"])
def create_schedule():
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
    price_adult = data.get("priceAdult", price)
    price_child = data.get("priceChild", price)
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
        price_adult = int(price_adult)
        price_child = int(price_child)
        total_seats = int(total_seats)
        if price_adult <= 0 or price_child <= 0 or total_seats <= 0:
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
        db.execute(
            "INSERT OR IGNORE INTO schedules (travel_date, company, price, price_adult, price_child, bus_type, total_seats, trip_time, notes, issuing_office) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (travel_date, company, price_adult, price_adult, price_child, bus_type, total_seats, trip_time, notes, issuing_office)
        )
        db.commit()
        row = db.execute("SELECT id, travel_date, company, price, price_adult, price_child, bus_type, total_seats, trip_time, notes, issuing_office FROM schedules WHERE travel_date = ? AND company = ?", (travel_date, company)).fetchone()
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    return jsonify({
        "message": "Schedule added.",
        "schedule": {
            "id": row["id"],
            "travelDate": row["travel_date"],
            "company": row["company"],
            "price": row["price"],
            "priceAdult": row["price_adult"],
            "priceChild": row["price_child"],
            "busType": row["bus_type"],
            "totalSeats": row["total_seats"],
            "tripTime": row["trip_time"],
            "notes": row["notes"],
            "issuingOffice": row["issuing_office"]
        }
    }), 201

@schedules_bp.route("/api/schedules/<int:schedule_id>/booked-seats", methods=["GET"])
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

@schedules_bp.route("/api/schedules/<int:schedule_id>", methods=["DELETE"])
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
