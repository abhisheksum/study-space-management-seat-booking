# StudyHub — Study Space Management & Seat Booking Platform

A modern, production-grade web platform for a dedicated **self-study library / study center**.

---

## 💡 Core Business Concept
**This is NOT a traditional lending library.**
* Students bring their own textbooks, notes, laptops, and tablets.
* The primary offering is a **guaranteed, assigned personal study seat** allocated according to designated time slots.
* **Anti-Overlap Engine**: Seats can be assigned to different students during non-overlapping shifts (e.g., Morning Student from 06:00 AM – 12:00 PM; Afternoon Student from 12:00 PM – 06:00 PM), but the system strictly prevents double-booking for overlapping hours or Full-Day members.
* Memberships are purchased on a flexible monthly basis (Full Day, Half Day, or Specific Single Shifts).

---

## 📁 Project Architecture

```
/
├── index.html              # Main landing page & value proposition
├── about.html              # Self-study concept & etiquette
├── facilities.html         # Amenities: ergonomic workstations, power outlets, quiet zones
├── pricing.html            # Shift plans, monthly rates, and full-day passes
├── seats.html              # Interactive seat allocation UI with slot switching
├── register.html           # Student membership enrollment form + confirmation
├── gallery.html            # Photo gallery with category filter & lightbox
├── contact.html            # Contact info, form, WhatsApp CTA, Maps & FAQs
├── css/                    # Global styles, components, responsive breakpoints
├── js/                     # Frontend JS: config, navigation, seats, register, gallery
├── images/                 # hero/, gallery/, facilities/, logo/
├── admin/                  # Admin console (login, dashboard, students, seats, bookings…)
├── server/                 # ← Node.js / Express backend (NEW)
│   ├── server.js           # Express entry point (mounts all routes, static files, error handler)
│   ├── config/
│   │   ├── database.js     # Re-exports MySQL pool
│   │   └── constants.js    # Slot windows, seat zones, status enums
│   ├── database/
│   │   ├── db.js           # MySQL2 promise pool + startup connection test
│   │   ├── schema.sql      # Full DDL for 9 tables (run once)
│   │   └── seed.sql        # Time slots, plans, 30 seats, sample students & bookings
│   ├── middleware/
│   │   ├── asyncWrapper.js # Wraps async handlers → auto next(err)
│   │   ├── errorHandler.js # Global Express error formatter
│   │   └── validate.js     # Zero-dependency field & schema validators
│   ├── models/
│   │   ├── Student.js      # CRUD for students table
│   │   ├── Seat.js         # Seat queries + LEFT JOIN availability map
│   │   ├── MembershipPlan.js
│   │   ├── Membership.js
│   │   ├── Booking.js      # ⚑ Overlap-aware booking queries
│   │   ├── Payment.js
│   │   ├── Attendance.js   # Check-in / check-out log
│   │   └── Admin.js
│   ├── controllers/        # Business logic + HTTP response shaping
│   ├── routes/             # Express Router files (one per resource)
│   ├── utils/
│   │   ├── overlapChecker.js  # ⚑ Core anti-overlap SQL query
│   │   └── responseHelper.js  # sendSuccess() / sendError() helpers
│   └── tests/
│       └── api.test.js     # Supertest integration tests
├── .env.example            # Environment variable template
├── package.json            # Scripts: start, dev, db:schema, db:seed
└── README.md
```

---

## ⚑ Anti-Overlap Booking Engine

The business rule *"the same seat cannot be booked by two students for overlapping time windows"* is enforced at **two layers**:

| Layer | File | Mechanism |
|---|---|---|
| Frontend | `js/seats.js` `checkTimeOverlap()` | Half-open interval math on mock data |
| **Backend (authoritative)** | `server/utils/overlapChecker.js` | SQL query with `start_hour < endHour AND end_hour > startHour` on live DB |

```sql
-- Overlap check in overlapChecker.js
SELECT id FROM bookings
WHERE seat_id      = ?
  AND booking_date = ?
  AND status       = 'active'
  AND start_hour   < ?    -- existing booking starts before requested slot ends
  AND end_hour     > ?    -- existing booking ends after requested slot starts
```

Adjacent slots share a boundary (morning ends at 12, afternoon starts at 12) — the `<` / `>` (not `<=` / `>=`) ensures they do **not** conflict.

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Step 1 — Install Dependencies
```bash
npm install
```

### Step 2 — Configure Environment
```bash
cp .env.example .env
# Edit .env and set your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=your_password
# DB_NAME=studyhub
# PORT=3000
```

### Step 3 — Initialize Database
```bash
# Create tables
mysql -u root -p < server/database/schema.sql

# Load seed data (slots, plans, 30 seats, sample students & bookings)
mysql -u root -p studyhub < server/database/seed.sql
```

### Step 4 — Start the Server

**Development (auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server starts at `http://localhost:3000`.  
The frontend pages are also served from the same port (Express static middleware).

---

## 📡 API Reference

All responses follow the envelope format:
```json
{ "success": true, "message": "...", "data": {...}, "meta": {...} }
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/plans` | List all membership plans (pricing page) |
| GET | `/api/plans/:id` | Get plan details |
| POST | `/api/students` | Register a new student |
| GET | `/api/students` | List students (`?search=`, `?city=`) |
| GET | `/api/students/:id` | Get student by ID |
| PATCH | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Soft-deactivate student |
| GET | `/api/seats` | List all 30 seats |
| GET | `/api/seats/availability?date=YYYY-MM-DD&slot=morning` | **Seat map for frontend** |
| PATCH | `/api/seats/:id/status` | Admin: set maintenance/active |
| POST | `/api/memberships` | Create membership |
| GET | `/api/memberships` | List memberships (`?student_id=`, `?status=`) |
| GET | `/api/memberships/:id` | Get membership |
| PATCH | `/api/memberships/:id/status` | Admin: activate/expire/cancel |
| POST | `/api/bookings` | **Create booking (anti-overlap enforced)** |
| GET | `/api/bookings` | List bookings (`?date=`, `?student_id=`, `?status=`) |
| GET | `/api/bookings/:id` | Get booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |
| PATCH | `/api/bookings/:id/complete` | Mark completed |
| POST | `/api/payments` | Record payment |
| GET | `/api/payments` | List payments (`?from_date=`, `?to_date=`) |
| GET | `/api/payments/stats/today` | Today's revenue (admin dashboard) |
| PATCH | `/api/payments/:id/status` | Confirm/reject payment |
| POST | `/api/attendance` | Student check-in |
| GET | `/api/attendance` | Attendance log (`?date=`, `?student_id=`) |
| GET | `/api/attendance/:id` | Get attendance record |
| PATCH | `/api/attendance/:id/checkout` | Student check-out |

---

## 🧪 Testing

Run the included supertest suite (mocks the DB, no MySQL needed):
```bash
npm install --save-dev jest
npm test
```

---

## 🎯 Next Steps (Phase 3)

1. **Student Authentication**: Phone OTP or email login. JWT tokens.
2. **Student Portal**: Dashboard showing active membership, seat number, days remaining.
3. **Payment Gateway**: Razorpay/Stripe integration with auto-invoice.
4. **Admin Authentication**: JWT + role-based access for admin routes.
5. **Push Notifications**: WhatsApp/SMS alerts on booking confirmation and membership expiry.
6. **File Uploads**: Profile photo upload endpoint with Multer middleware.
