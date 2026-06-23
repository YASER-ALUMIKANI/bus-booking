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
            
        # ponytail: Make request
        response = self.client.get(
            "/api/bookings",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        res_json = response.get_json()
        self.assertIn("bookings", res_json)
        self.assertIn("db_size", res_json)
        self.assertGreaterEqual(res_json["db_size"], 0)

    def test_client_status_and_verification_workflow(self):
        # 1. Status is unverified when no request exists
        with self.client.session_transaction() as sess:
            sess["client_phone"] = "770000001"
            
        # Add client user to database
        with server.app.app_context():
            db = server.get_db()
            db.execute(
                "INSERT OR REPLACE INTO client_users (phone, password_hash, created_at) VALUES (?, ?, ?)",
                ("770000001", "some_hash", int(time.time()))
            )
            db.commit()
            
        res = self.client.get("/api/client/status")
        self.assertEqual(res.status_code, 200)
        status_data = res.get_json()
        self.assertTrue(status_data["isLoggedIn"])
        self.assertEqual(status_data["verificationStatus"], "unverified")

        # 2. Submit verification request
        import io
        from PIL import Image as PILImage
        img_byte_arr = io.BytesIO()
        img = PILImage.new('RGB', (1, 1), color='blue')
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)

        original_csrf = server.require_csrf_token
        server.require_csrf_token = lambda: True

        try:
            data = {
                "fullname": "ياسر الحميّقاني",
                "identityType": "جواز سفر",
                "identityNumber": "12356323",
                "issueDate": "2026-06-23",
                "issuePlace": "عدن",
                "identityImage": (img_byte_arr, "identity.png"),
            }
            res = self.client.post(
                "/api/client/verify",
                data=data,
                content_type="multipart/form-data"
            )
            self.assertEqual(res.status_code, 200)
            res_json = res.get_json()
            self.assertEqual(res_json["status"], "pending")

            # 3. Check client status is now pending
            res = self.client.get("/api/client/status")
            self.assertEqual(res.get_json()["verificationStatus"], "pending")

            # 4. Admin lists verifications
            with server.app.app_context():
                db = server.get_db()
                token = "admin-verify-token"
                db.execute(
                    "INSERT INTO admin_tokens (token, username, role, created_at) VALUES (?, ?, ?, ?)",
                    (token, "manager", "manager", int(time.time()))
                )
                db.commit()

            res = self.client.get(
                "/api/admin/verifications",
                headers={"Authorization": f"Bearer {token}"}
            )
            self.assertEqual(res.status_code, 200)
            ver_list = res.get_json()["verifications"]
            self.assertEqual(len(ver_list), 1)
            req_id = ver_list[0]["id"]
            self.assertEqual(ver_list[0]["fullname"], "ياسر الحميّقاني")

            # 5. Admin approves verification
            res = self.client.post(
                f"/api/admin/verifications/{req_id}/approve",
                headers={"Authorization": f"Bearer {token}", "X-CSRF-Token": "dummy_csrf"} # require_csrf_token is mocked to True
            )
            self.assertEqual(res.status_code, 200)

            # 6. Check status is now approved (verified)
            res = self.client.get("/api/client/status")
            self.assertEqual(res.get_json()["verificationStatus"], "approved")

        finally:
            server.require_csrf_token = original_csrf
            # Clean up uploaded verification file
            with server.app.app_context():
                db = server.get_db()
                row = db.execute("SELECT identity_image FROM verification_requests WHERE phone = '770000001'").fetchone()
                if row:
                    path = server.VERIFICATION_UPLOAD_DIR / row["identity_image"]
                    if path.exists():
                        try:
                            path.unlink()
                        except Exception:
                            pass

    def test_create_schedule_with_separate_pricing(self):
        # Verify we can add a schedule with separate pricing for adults and children
        with server.app.app_context():
            db = server.get_db()
            token = "admin-schedule-pricing-token"
            db.execute(
                "INSERT INTO admin_tokens (token, username, role, created_at) VALUES (?, ?, ?, ?)",
                (token, "manager", "manager", int(time.time()))
            )
            db.commit()

        original_csrf = server.require_csrf_token
        server.require_csrf_token = lambda: True

        try:
            data = {
                "travelDate": "2026-07-15",
                "company": "البراق",
                "priceAdult": 45000,
                "priceChild": 30000,
                "busType": "VIP",
                "totalSeats": 30,
                "tripTime": "09:00:00 PM",
                "notes": "فرزة عدن",
                "issuingOffice": "مكتب عدن"
            }
            res = self.client.post(
                "/api/schedules",
                json=data,
                headers={"Authorization": f"Bearer {token}"}
            )
            self.assertEqual(res.status_code, 201)
            res_json = res.get_json()
            self.assertEqual(res_json["schedule"]["priceAdult"], 45000)
            self.assertEqual(res_json["schedule"]["priceChild"], 30000)

            # Get schedules list
            res_get = self.client.get("/api/schedules")
            self.assertEqual(res_get.status_code, 200)
            dates = res_get.get_json()["dates"]
            inserted = [d for d in dates if d["travelDate"] == "2026-07-15" and d["company"] == "البراق"]
            self.assertEqual(len(inserted), 1)
            self.assertEqual(inserted[0]["priceAdult"], 45000)
            self.assertEqual(inserted[0]["priceChild"], 30000)
        finally:
            server.require_csrf_token = original_csrf

    def test_booking_with_passenger_type(self):
        # Verify bookings get charged the correct price depending on passengerType
        with server.app.app_context():
            db = server.get_db()
            db.execute(
                "INSERT OR REPLACE INTO schedules (travel_date, company, price_adult, price_child, bus_type, total_seats, trip_time, notes, issuing_office) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ("2026-07-20", "إكسبرس", 50000, 35000, "VIP", 40, "06:30:00 PM", "الصعود من عفار", "مكتب وكيل")
            )
            db.commit()

        original_csrf = server.require_csrf_token
        server.require_csrf_token = lambda: True

        booking_id_adult = None
        booking_id_child = None
        try:
            import io
            from PIL import Image as PILImage
            img_byte_arr = io.BytesIO()
            img = PILImage.new('RGB', (1, 1), color='yellow')
            img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)

            # Book adult
            data_adult = {
                "passengerName": "مسافر بالغ",
                "phone": "771111111",
                "passport": "P12345678",
                "travelDate": "2026-07-20",
                "company": "إكسبرس",
                "origin": "صنعاء",
                "destination": "الرياض",
                "seat": "10",
                "dob": "1990",
                "passengerType": "adult",
                "passportImage": (io.BytesIO(img_byte_arr.getvalue()), "passport_adult.png"),
            }
            res_adult = self.client.post(
                "/api/bookings",
                data=data_adult,
                content_type="multipart/form-data"
            )
            self.assertEqual(res_adult.status_code, 201)
            booking_id_adult = res_adult.get_json()["ticketNumber"].split("-")[1]

            # Book child
            data_child = {
                "passengerName": "مسافر طفل",
                "phone": "771111111",
                "passport": "C12345678",
                "travelDate": "2026-07-20",
                "company": "إكسبرس",
                "origin": "صنعاء",
                "destination": "الرياض",
                "seat": "11",
                "dob": "2018",
                "passengerType": "child",
                "passportImage": (io.BytesIO(img_byte_arr.getvalue()), "passport_child.png"),
            }
            res_child = self.client.post(
                "/api/bookings",
                data=data_child,
                content_type="multipart/form-data"
            )
            self.assertEqual(res_child.status_code, 201)
            booking_id_child = res_child.get_json()["ticketNumber"].split("-")[1]

            # Assert database prices are correct
            with server.app.app_context():
                db = server.get_db()
                row_adult = db.execute("SELECT price FROM bookings WHERE id = ?", (booking_id_adult,)).fetchone()
                row_child = db.execute("SELECT price FROM bookings WHERE id = ?", (booking_id_child,)).fetchone()
                
                self.assertEqual(row_adult["price"], 50000)
                self.assertEqual(row_child["price"], 35000)

        finally:
            server.require_csrf_token = original_csrf
            # clean up files
            for bid in [booking_id_adult, booking_id_child]:
                if bid:
                    path = server.UPLOAD_DIR / f"{bid}.png"
                    if path.exists():
                        try:
                            path.unlink()
                        except Exception:
                            pass

if __name__ == "__main__":
    unittest.main()
