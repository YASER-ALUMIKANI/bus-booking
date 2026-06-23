import time
from flask import request
from backend.database.db import get_db

BOOKING_RATE_LIMIT = 15
BOOKING_RATE_WINDOW_SECONDS = 60
booking_request_log = {}

def row_to_booking(row):
    keys = row.keys()
    passport_image = row["passport_image"] if "passport_image" in keys else None
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
        "payment_ref": row["payment_ref"] if "payment_ref" in keys else None,
        "payment_image": row["payment_image"] if "payment_image" in keys else None,
        "payment_image_url": f"/uploads/payments/{row['payment_image']}" if ("payment_image" in keys and row["payment_image"]) else None,
    }

def get_client_ip():
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"

def is_rate_limited(ip):
    now = int(time.time())
    window_start = now - BOOKING_RATE_WINDOW_SECONDS
    
    if len(booking_request_log) > 1000:
        for k in list(booking_request_log.keys()):
            booking_request_log[k] = [t for t in booking_request_log[k] if t >= window_start]
            if not booking_request_log[k]:
                booking_request_log.pop(k, None)

    request_times = booking_request_log.get(ip, [])
    request_times = [t for t in request_times if t >= window_start]
    if len(request_times) >= BOOKING_RATE_LIMIT:
        booking_request_log[ip] = request_times
        return True
    request_times.append(now)
    booking_request_log[ip] = request_times
    return False
