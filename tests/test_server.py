import os
import sqlite3
import time
import unittest
import sys
from pathlib import Path

# ponytail: Configure test environment
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ADMIN_MANAGER_PASSWORD"] = "testmanager123"

# ponytail: Add parent directory to path so we can import server
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server

class YemenBusServerTestCase(unittest.TestCase):
    def setUp(self):
        server.app.config["TESTING"] = True
        server.app.config["WTF_CSRF_ENABLED"] = False
        # Use a separate test database file
        server.DB_FILE = server.BASE_DIR / "test_app.db"
        if server.DB_FILE.exists():
            try:
                server.DB_FILE.unlink()
            except Exception:
                pass
        
        # Initialize db
        with server.app.app_context():
            server.init_db()
            
        self.client = server.app.test_client()

    def tearDown(self):
        if server.DB_FILE.exists():
            try:
                server.DB_FILE.unlink()
            except Exception:
                pass

    def test_wal_mode_enabled(self):
        # ponytail: Verify SQLite WAL mode is successfully set up
        with server.app.app_context():
            db = server.get_db()
            res = db.execute("PRAGMA journal_mode;").fetchone()
            self.assertEqual(res[0].lower(), "wal")

    def test_admin_password_env_override(self):
        # ponytail: Verify env password works and hash checks out
        with server.app.app_context():
            user = server.get_admin_user("manager")
            self.assertIsNotNone(user)
            self.assertTrue(server.check_password_hash(user["password_hash"], "testmanager123"))

    def test_admin_token_persistence(self):
        # ponytail: Verify admin tokens table and verify_token behavior
        with server.app.app_context():
            db = server.get_db()
            # Insert a fake token
            token = "fake-token-123"
            db.execute(
                "INSERT INTO admin_tokens (token, username, role, created_at) VALUES (?, ?, ?, ?)",
                (token, "manager", "manager", int(time.time()))
            )
            db.commit()
            
            # Verify via helper
            user = server.verify_token(token)
            self.assertIsNotNone(user)
            self.assertEqual(user["username"], "manager")
            self.assertEqual(user["role"], "manager")

    def test_admin_token_expiration(self):
        # ponytail: Verify expired token (older than 7 days) gets cleaned up and fails
        with server.app.app_context():
            db = server.get_db()
            token = "expired-token"
            eight_days_ago = int(time.time()) - (8 * 24 * 3600)
            db.execute(
                "INSERT INTO admin_tokens (token, username, role, created_at) VALUES (?, ?, ?, ?)",
                (token, "manager", "manager", eight_days_ago)
            )
            db.commit()
            
            # Verifying should return None and clean it up
            user = server.verify_token(token)
            self.assertIsNone(user)
            
            row = db.execute("SELECT 1 FROM admin_tokens WHERE token = ?", (token,)).fetchone()
            self.assertIsNone(row)

    def test_rate_limiter_pruning(self):
        # ponytail: Verify pruning rate limiter dict keeps memory bounded
        server.booking_request_log.clear()
        # Add 1005 keys to rate limit log
        for i in range(1005):
            server.booking_request_log[f"192.168.1.{i}"] = [int(time.time()) - 100]
            
        # Triggering rate limiter check for a new IP should prune the dictionary
        server.is_rate_limited("10.0.0.1")
        
        # Verify the size of the log has been pruned (should contain only the non-expired/active entries)
        # All 1005 entries had timestamp from 100s ago, which is expired (60s window)
        # So they should all be pruned, leaving only 10.0.0.1 in the dictionary
        self.assertEqual(len(server.booking_request_log), 1)
        self.assertIn("10.0.0.1", server.booking_request_log)

    def test_booking_optional_payment(self):
        # ponytail: Verify that creating a booking works with optional payment fields omitted
        original_csrf = server.require_csrf_token
        server.require_csrf_token = lambda: True
        
        booking_id = None
        try:
            # 1. Add a schedule to database
            with server.app.app_context():
                db = server.get_db()
                db.execute(
                    "INSERT OR REPLACE INTO schedules (travel_date, company, price, bus_type, total_seats, trip_time, notes, issuing_office) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    ("2026-07-01", "البركة", 35000, "VIP", 40, "06:30:00 PM", "الصعود من عفار", "مكتب وكيل")
                )
                db.commit()
            
            # 2. Make request without payment fields
            import io
            from PIL import Image as PILImage
            img_byte_arr = io.BytesIO()
            img = PILImage.new('RGB', (1, 1), color='red')
            img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)

            data = {
                "passengerName": "احمد محمد",
                "phone": "777777777",
                "passport": "A12345678",
                "travelDate": "2026-07-01",
                "company": "البركة",
                "origin": "صنعاء",
                "destination": "الرياض",
                "seat": "15",
                "dob": "1990",
                "passportImage": (img_byte_arr, "passport.png"),
            }
            
            response = self.client.post(
                "/api/bookings",
                data=data,
                content_type="multipart/form-data"
            )
            
            self.assertEqual(response.status_code, 201)
            res_json = response.get_json()
            self.assertIn("ticketNumber", res_json)
            
            ticket_num = res_json["ticketNumber"]
            booking_id = ticket_num.split("-")[1]
            
            # 3. Check database to verify booking is saved and payment fields are None/empty
            with server.app.app_context():
                db = server.get_db()
                row = db.execute("SELECT payment_ref, payment_image FROM bookings WHERE id = ?", (booking_id,)).fetchone()
                self.assertIsNotNone(row)
                self.assertIsNone(row["payment_ref"])
                self.assertIsNone(row["payment_image"])
                
        finally:
            server.require_csrf_token = original_csrf
            if booking_id:
                # Clean up uploaded passport file
                path = server.UPLOAD_DIR / f"{booking_id}.png"
                if path.exists():
                    try:
                        path.unlink()
                    except Exception:
                        pass

    def test_bookings_api_db_size(self):
        # ponytail: Verify bookings endpoint returns db_size and bookings list
        with server.app.app_context():
            db = server.get_db()
            token = "test-db-size-token"
            db.execute(
                "INSERT INTO admin_tokens (token, username, role, created_at) VALUES (?, ?, ?, ?)",
                (token, "manager", "manager", int(time.time()))
            )
            db.commit()
            
        response = self.client.get(
            "/api/bookings",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        res_json = response.get_json()
        self.assertIn("bookings", res_json)
        self.assertIn("db_size", res_json)
        self.assertGreaterEqual(res_json["db_size"], 0)

if __name__ == "__main__":
    unittest.main()
