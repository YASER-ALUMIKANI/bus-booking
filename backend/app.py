import os
import logging
from pathlib import Path
from flask import Flask, send_from_directory, abort, request, jsonify, session
from backend.database.db import (
    get_db, init_db, UPLOAD_DIR, PAYMENT_UPLOAD_DIR, VERIFICATION_UPLOAD_DIR, DIST_DIR
)
from backend.services.auth_service import get_current_user, verify_token

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=str(DIST_DIR / "assets"), static_url_path="/assets")
_default_secret = "yemenbus-dev-secret-key-change-in-production-2026"
app.secret_key = os.environ.get("SECRET_KEY", _default_secret)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

# Error handler for file size
@app.errorhandler(413)
def request_entity_too_large(error):
    max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
    return jsonify({"message": f"حجم الملف كبير جداً. الحد الأقصى المسموح به هو {max_mb} ميغابايت."}), 413

# Import Blueprints
from backend.routes.auth import auth_bp
from backend.routes.bookings import bookings_bp
from backend.routes.schedules import schedules_bp
from backend.routes.verification import verification_bp
from backend.routes.admin import admin_bp

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(schedules_bp)
app.register_blueprint(verification_bp)
app.register_blueprint(admin_bp)

# Register request logger
@app.before_request
def log_request_info():
    logger.info("[REQUEST] %s %s", request.method, request.path)

# Teardown database connections
@app.teardown_appcontext
def close_connection(exception=None):
    from flask import g
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

# Secure static file serving routes
@app.route('/uploads/passports/<path:filename>')
def serve_passport_image(filename: str):
    current_user = get_current_user()
    if not current_user:
        token = request.args.get("token")
        if token:
            current_user = verify_token(token)
            
    if current_user:
        return send_from_directory(UPLOAD_DIR, filename)

    phone = session.get("client_phone")
    if phone:
        db = get_db()
        booking = db.execute("SELECT 1 FROM bookings WHERE phone = ? AND passport_image = ?", (phone, filename)).fetchone()
        if booking:
            return send_from_directory(UPLOAD_DIR, filename)

    return abort(403)

@app.route('/uploads/payments/<path:filename>')
def serve_payment_image(filename: str):
    current_user = get_current_user()
    if not current_user:
        token = request.args.get("token")
        if token:
            current_user = verify_token(token)
            
    if current_user:
        return send_from_directory(PAYMENT_UPLOAD_DIR, filename)

    phone = session.get("client_phone")
    if phone:
        db = get_db()
        booking = db.execute("SELECT 1 FROM bookings WHERE phone = ? AND payment_image = ?", (phone, filename)).fetchone()
        if booking:
            return send_from_directory(PAYMENT_UPLOAD_DIR, filename)

    return abort(403)

@app.route('/uploads/verifications/<path:filename>')
def serve_verification_image(filename: str):
    current_user = get_current_user()
    if not current_user:
        token = request.args.get("token")
        if token:
            current_user = verify_token(token)
            
    if current_user:
        return send_from_directory(VERIFICATION_UPLOAD_DIR, filename)

    phone = session.get("client_phone")
    if phone:
        db = get_db()
        verify_req = db.execute("SELECT 1 FROM verification_requests WHERE phone = ? AND identity_image = ?", (phone, filename)).fetchone()
        if verify_req:
            return send_from_directory(VERIFICATION_UPLOAD_DIR, filename)

    return abort(403)

# Catch-all and Single Page Application (SPA) routing
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

# Initialize database schema inside app context
with app.app_context():
    init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
