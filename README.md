# YemenBus - نظام حجز تذاكر الحافلات اليمني المتقدم
YemenBus هو نظام ويب متكامل ومخصص لإدارة وحجز تذاكر حافلات النقل الجماعي في اليمن، مصمم لتسهيل عملية الحجز للركاب وتوفير لوحة تحكم شاملة واحترافية للمسؤولين والمدراء لإدارة الحجوزات والموظفين بأعلى مستويات الأمان والسرعة.

---

## 🌟 الميزات الرئيسية (Key Features)

### 🧑‍💼 للركاب (Passenger Experience)
- **حجز مقاعد تفاعلي**: واجهة مستخدم رسومية لاختيار المقاعد وحساب الأسعار بشكل حي ومقرار بناءً على الرحلة والشركة المختارة.
- **إرفاق الوثائق الرسمية**: رفع صورة جواز السفر بطريقة آمنة مع التحقق التلقائي من صحة الصور المرفوعة وصيغتها لمنع الثغرات الأمنية.
- **خيارات الدفع بالتحويل المالي (اختياري)**: إدخال رقم الحوالة المالية المرجعي وإرفاق صورة إشعار التحويل لتسهيل وتأكيد الحجز.

### 💼 للموظفين والتحقق (Employee Portal)
- **صفحة الإشعارات المباشرة (`/admin`)**: مخصصة للموظفين لتلقي طلبات الحجز المعلقة والتحقق منها وتأكيدها أو إلغائها مع كتابة مبررات الإلغاء.
- **الطباعة الفورية للتذاكر**: إمكانية طباعة تذاكر الركاب المؤكدة بضغطة زر واحدة بشكل منسق واحترافي.
- **طلب تغيير حالة الحجز**: خيار طلب إلغاء أو تغيير الحجوزات المؤكدة مع إخضاعها للموافقة الأمنية بكلمة مرور المدير.

### 👑 للمدراء ولوحة التحكم المتقدمة (`/admin/dashboard`)
- **لوحة تحكم بنظام cPanel (cPanel-Style Dashboard)**: لوحة تحكم تماثل واجهات الاستضافة الاحترافية (قوائم جانبية مبوبة، أدوات منظمة، لوحة إحصائيات حية، ومعلومات عامة للنظام).
- **أمان وعزل كامل للصلاحيات**:
  - حصر لوحة التحكم بالكامل لمدير النظام (`manager`).
  - عزل حسابات الموظفين (`employee`) ومنعهم تماماً من رؤية أو دخول لوحة التحكم مع توجيههم تلقائياً لصفحة الإشعارات عند محاولة الدخول.
  - إخفاء روابط لوحة التحكم من حسابات الموظفين تماماً.
- **مستعرض تفاعلي لقاعدة البيانات**: استعراض الحجوزات بالكامل مع ميزات البحث السريع والفرز المتقدم حسب تواريخ السفر وحالات الطلب.
- **تصدير كشوفات Excel**: إمكانية تنزيل نسخة احتياطية لكافة الحجوزات بصيغة CSV المتوافقة تماماً مع Excel بضغطة زر.
- **طباعة البيان (Manifest)**: طباعة كشف ركاب الرحلة (البيان) بشكل منسق ومبوب تلقائياً بناءً على تاريخ السفر، بحيث يتم طباعة كشف كل تاريخ في صفحة منفصلة تلقائياً.
- **إدارة المشرفين**: إضافة حسابات مسؤولين جدد وتحديد أدوارهم وصلاحياتهم (مدير أو موظف).

---

## 🛠️ البنية التقنية (Tech Stack)

### الواجهة الأمامية (Frontend)
- **React.js + Vite**: لبناء واجهة سريعة الاستجابة وذات كفاءة عالية.
- **TailwindCSS**: للتصميم التفاعلي والعصري والألوان المتناسقة.
- **Framer Motion**: للمؤثرات البصرية والانتقالات السلسة.

### الواجهة الخلفية وقاعدة البيانات (Backend & Database)
- **Flask (Python)**: لتوفير خدمات الويب والـ API بطريقة مرنة وسريعة.
- **SQLite (WAL Mode)**: قاعدة بيانات محلية سريعة وموثوقة، تم تفعيل وضع **Write-Ahead Logging (WAL)** لضمان معالجة متزامنة عالية الحجم وتجنب قفل قاعدة البيانات عند ضغط العمليات.
- **Waitress WSGI Server**: خادم الإنتاج الأساسي لتشغيل التطبيق بكفاءة لتحمل مئات الطلبات اليومية بأمان تام.
- **نظام الحماية والأمان**:
  - حماية صارمة ضد هجمات **CSRF** و**XSS**.
  - التحقق من صحة الملفات المرفوعة عبر **Magic Bytes** لمنع هجمات رفع الملفات الخبيثة.
  - التشفير الآمن لكلمات المرور باستخدام **SHA-256 (pbkdf2:sha256)**.
  - إدارة الجلسات ورموز الوصول (Tokens) المنتهية تلقائياً بعد 7 أيام والمخزنة في قاعدة البيانات.

---

## 🚀 التشغيل والتثبيت (Installation & Running)

### المتطلبات المسبقة
- تثبيت بايثون إصدار 3.8 أو أعلى.
- تثبيت Node.js و npm.

### 1. تثبيت الاعتمادات (Install Dependencies)

قم بتثبيت مكتبات بايثون:
```bash
pip install -r requirements.txt
```

قم بتثبيت اعتمادات الواجهة الأمامية:
```bash
npm install
```

### 2. بناء الواجهة الأمامية (Build Frontend)
لبناء ملفات الإنتاج النهائية المضغوطة:
```bash
npm run build
```
سيقوم Vite بإنشاء مجلد `dist` يحتوي على الأصول والملفات الجاهزة للنشر والتخديم عبر Flask.

### 3. تشغيل خادم الإنتاج (Run Production Server)
لتشغيل النظام في بيئة إنتاجية جاهزة للعمل الحقيقي واستقبال مئات الطلبات عبر خادم **Waitress**:
```bash
python run_production.py
```
سيبدأ الخادم بالعمل على الرابط المباشر: `http://localhost:5000`

---

## 🧪 نظام الاختبارات (Testing)
تم بناء اختبارات آلية شاملة تغطي التحقق من وضع WAL، حماية المجلدات، تشفير كلمات المرور، وسلامة تدفق الحجوزات بدون إرفاق الحوالات المالية. 
لتشغيل الاختبارات:
```bash
python -m unittest discover tests
```

---

## 👤 حسابات المسؤولين الافتراضية
عند تشغيل النظام لأول مرة، يتم تلقائياً إنشاء الحسابات التجريبية التالية في قاعدة البيانات:
- **حساب المدير (مدير النظام بكامل الصلاحيات):**
  - اسم المستخدم: `manager`
  - كلمة المرور: `admin123`
- **حساب الموظف (موظف موافق تذاكر):**
  - اسم المستخدم: `employee`
  - كلمة المرور: `employee123`

---
---

# YemenBus - Advanced Bus Ticket Booking System

YemenBus is a complete web application designed for booking and managing group transit bus tickets in Yemen. It is built to offer a seamless booking experience for passengers and a robust, secure cPanel-style management interface for admins and employees to manage bookings and server resources with high security and speed.

---

## 🌟 Key Features

### 🧑‍💼 Passenger Experience
- **Interactive Seat Selection**: A responsive visual interface to choose seats and dynamically calculate ticket prices based on the selected trip, city, and bus company.
- **Passport Document Upload**: Safe passport photo uploads with backend validation using magic bytes verification to prevent malicious file uploads.
- **Optional Payment Reference & Image**: Passengers can optionally enter transaction reference numbers and upload payment receipt images to request ticket confirmation.

### 💼 Employee Portal
- **Real-Time Notification Panel (`/admin`)**: A dedicated view for validation agents (employees) to receive booking requests and easily confirm or cancel them (with cancellation reason).
- **Instant Ticket Printing**: Instantly print tickets with a clean, printer-friendly layout for passengers.
- **Change Request System**: Employees can request ticket status changes, which are protected and require a manager's override password.

### 👑 Manager & Administration cPanel (`/admin/dashboard`)
- **cPanel-Style Dashboard**: A premium, hosting-style administration panel with tabbed navigation, categorised tools, server telemetry details, and real-time statistics.
- **Role-Based Access Control (RBAC) & Redirects**:
  - The cPanel dashboard is strictly limited to the `manager` role.
  - Normal employees (`employee`) are automatically blocked and redirected to `/admin` if they attempt to navigate to `/admin/dashboard` manually.
  - All control panel access links are hidden from non-manager views.
- **Interactive Database Explorer**: Easily search, view, and filter passenger details by travel dates, statuses, and routes.
- **Excel Export**: Export the entire database or filtered views to CSV format with a single click.
- **Manifest Printing**: Print travel manifests automatically grouped by travel date. If "All Dates" is selected, it inserts automatic page breaks (`page-break-after: always`) to print a separate manifest page for each date.
- **Admin Management**: Add new administrators and assign them roles (`manager` or `employee`).

---

## 🛠️ Tech Stack

### Frontend
- **React.js + Vite**: For quick page loads and smooth user interactions.
- **TailwindCSS**: Premium responsive styling with uniform colors.
- **Framer Motion**: Smooth micro-animations and page transitions.

### Backend & Database
- **Flask (Python)**: Light and robust backend APIs.
- **SQLite (WAL Mode)**: Relational local database using Write-Ahead Logging (WAL) mode to support concurrent writes and prevent locking.
- **Waitress WSGI Server**: Multi-threaded production WSGI server capable of handling hundreds of requests daily.
- **Security Protocols**:
  - CSRF protection enabled.
  - File upload sanitization checking magic bytes headers.
  - Secure pbkdf2 password hashing (SHA-256).
  - Session tokens stored in database with a 7-day expiration.

---

## 🚀 Installation & Running

### Prerequisites
- Python 3.8 or higher.
- Node.js and npm installed.

### 1. Install Dependencies
Install Python requirements:
```bash
pip install -r requirements.txt
```

Install frontend packages:
```bash
npm install
```

### 2. Build Frontend
Build production-ready compiled assets:
```bash
npm run build
```
Vite will compile files into the `dist` directory.

### 3. Run Production Server
To launch using the multi-threaded production WSGI server (Waitress):
```bash
python run_production.py
```
Open `http://localhost:5000` in your browser.

---

## 🧪 Testing
The backend test suite verifies SQLite WAL mode, security parameters, and ticket workflow logic. Run them using:
```bash
python -m unittest discover tests
```

---

## 👤 Default Admin Credentials
When database is initialized, the following default credentials are automatically populated:
- **Manager Account (Full Admin access):**
  - Username: `manager`
  - Password: `admin123`
- **Employee Account (Booking approval agent):**
  - Username: `employee`
  - Password: `employee123`
