-- =============================================================================
-- StudyHub — Seed Data
-- Run AFTER schema.sql: mysql -u root -p studyhub < server/database/seed.sql
-- =============================================================================

USE studyhub;

-- -----------------------------------------------------------------------------
-- TIME SLOTS (matches SLOT_TIME_WINDOWS in js/seats.js)
-- -----------------------------------------------------------------------------
INSERT INTO time_slots (name, slot_key, start_hour, end_hour, label) VALUES
  ('Morning Shift',                  'morning',      6,  12, '06:00 AM – 12:00 PM'),
  ('Afternoon Shift',                'afternoon',    12, 18, '12:00 PM – 06:00 PM'),
  ('Evening Shift',                  'evening',      18, 22, '06:00 PM – 10:00 PM'),
  ('Half Day (Morning + Afternoon)', 'half-day-am',  6,  18, '06:00 AM – 06:00 PM'),
  ('Half Day (Afternoon + Evening)', 'half-day-pm',  12, 23, '12:00 PM – 11:00 PM'),
  ('Full Day Pass',                  'full-day',     6,  23, '06:00 AM – 11:00 PM')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- -----------------------------------------------------------------------------
-- MEMBERSHIP PLANS
-- Prices are examples — update via admin panel
-- -----------------------------------------------------------------------------
INSERT INTO membership_plans (name, type, slot_id, price, duration_days, description, features) VALUES
  (
    'Full Day Pass',
    'full_day',
    (SELECT id FROM time_slots WHERE slot_key = 'full-day'),
    1499.00, 30,
    'Unlimited access to a dedicated workstation from 6 AM to 11 PM, every day.',
    '["Dedicated seat","All-day access 6AM-11PM","High-speed WiFi","Charging point","Power backup","CCTV security","Drinking water","Clean washrooms","Air conditioning"]'
  ),
  (
    'Half Day Pass',
    'half_day',
    (SELECT id FROM time_slots WHERE slot_key = 'half-day-am'),
    899.00, 30,
    'Your choice of AM shift (6AM–6PM) or PM shift (12PM–11PM). Selected at registration.',
    '["Dedicated seat","6-hour shift","High-speed WiFi","Charging point","Power backup","CCTV security","Drinking water"]'
  ),
  (
    'Morning Slot',
    'slot',
    (SELECT id FROM time_slots WHERE slot_key = 'morning'),
    599.00, 30,
    'Dedicated seat every morning from 6:00 AM to 12:00 PM.',
    '["Dedicated seat","Morning 6AM-12PM","High-speed WiFi","Charging point","Power backup","CCTV security"]'
  ),
  (
    'Afternoon Slot',
    'slot',
    (SELECT id FROM time_slots WHERE slot_key = 'afternoon'),
    599.00, 30,
    'Dedicated seat every afternoon from 12:00 PM to 6:00 PM.',
    '["Dedicated seat","Afternoon 12PM-6PM","High-speed WiFi","Charging point","Power backup","CCTV security"]'
  ),
  (
    'Evening Slot',
    'slot',
    (SELECT id FROM time_slots WHERE slot_key = 'evening'),
    499.00, 30,
    'Dedicated seat every evening from 6:00 PM to 10:00 PM.',
    '["Dedicated seat","Evening 6PM-10PM","High-speed WiFi","Charging point","Power backup","CCTV security"]'
  )
ON DUPLICATE KEY UPDATE price=VALUES(price);

-- -----------------------------------------------------------------------------
-- SEATS (30 workstations: A01–A10, B01–B10, C01–C10)
-- -----------------------------------------------------------------------------
INSERT INTO seats (seat_number, zone, row_position) VALUES
  ('A01','A',1),('A02','A',2),('A03','A',3),('A04','A',4),('A05','A',5),
  ('A06','A',6),('A07','A',7),('A08','A',8),('A09','A',9),('A10','A',10),
  ('B01','B',1),('B02','B',2),('B03','B',3),('B04','B',4),('B05','B',5),
  ('B06','B',6),('B07','B',7),('B08','B',8),('B09','B',9),('B10','B',10),
  ('C01','C',1),('C02','C',2),('C03','C',3),('C04','C',4),('C05','C',5),
  ('C06','C',6),('C07','C',7),('C08','C',8),('C09','C',9),('C10','C',10)
ON DUPLICATE KEY UPDATE zone=VALUES(zone);

-- -----------------------------------------------------------------------------
-- Admin accounts must be provisioned out-of-band with a bcrypt hash.
-- Never seed a shared development password into a deployed database.

-- -----------------------------------------------------------------------------
-- SAMPLE STUDENTS
-- -----------------------------------------------------------------------------
INSERT INTO students (full_name, mobile, email, gender, city, state, pincode) VALUES
  ('Rahul Sharma',   '9876543201', 'rahul@example.com',   'male',   'Greater Noida', 'Uttar Pradesh', '201306'),
  ('Priya Singh',    '9876543202', 'priya@example.com',   'female', 'Noida',          'Uttar Pradesh', '201301'),
  ('Amit Kumar',     '9876543203', 'amit@example.com',    'male',   'Delhi',          'Delhi',          '110001'),
  ('Sneha Patel',    '9876543204', 'sneha@example.com',   'female', 'Greater Noida', 'Uttar Pradesh', '201310'),
  ('Vikram Yadav',   '9876543205', 'vikram@example.com',  'male',   'Ghaziabad',      'Uttar Pradesh', '201001')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- -----------------------------------------------------------------------------
-- SAMPLE MEMBERSHIPS (Rahul = Full Day on A01, Priya = Morning on B03)
-- -----------------------------------------------------------------------------
INSERT INTO memberships (student_id, plan_id, seat_id, start_date, end_date, status)
SELECT
  s.id,
  p.id,
  st.id,
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  'active'
FROM students s, membership_plans p, seats st
WHERE s.mobile = '9876543201'
  AND p.type    = 'full_day'
  AND st.seat_number = 'A01'
ON DUPLICATE KEY UPDATE status=status;

INSERT INTO memberships (student_id, plan_id, seat_id, start_date, end_date, status)
SELECT
  s.id,
  p.id,
  st.id,
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  'active'
FROM students s, membership_plans p, seats st
WHERE s.mobile = '9876543202'
  AND p.name   = 'Morning Slot'
  AND st.seat_number = 'B03'
ON DUPLICATE KEY UPDATE status=status;

-- -----------------------------------------------------------------------------
-- SAMPLE BOOKINGS (uses actual IDs via subquery — safe even if IDs shift)
-- -----------------------------------------------------------------------------
-- Rahul: Full Day on A01 for today
INSERT INTO bookings (student_id, seat_id, slot_key, booking_date, start_hour, end_hour, status)
SELECT s.id, st.id, 'full-day', CURDATE(), 6, 23, 'active'
FROM students s, seats st
WHERE s.mobile = '9876543201' AND st.seat_number = 'A01'
ON DUPLICATE KEY UPDATE status=status;

-- Priya: Morning on B03 for today
INSERT INTO bookings (student_id, seat_id, slot_key, booking_date, start_hour, end_hour, status)
SELECT s.id, st.id, 'morning', CURDATE(), 6, 12, 'active'
FROM students s, seats st
WHERE s.mobile = '9876543202' AND st.seat_number = 'B03'
ON DUPLICATE KEY UPDATE status=status;

-- Amit: Afternoon on B03 for today (NON-OVERLAPPING with Priya's morning — should be ALLOWED)
INSERT INTO bookings (student_id, seat_id, slot_key, booking_date, start_hour, end_hour, status)
SELECT s.id, st.id, 'afternoon', CURDATE(), 12, 18, 'active'
FROM students s, seats st
WHERE s.mobile = '9876543203' AND st.seat_number = 'B03'
ON DUPLICATE KEY UPDATE status=status;

-- Sneha: Evening on C05 for today
INSERT INTO bookings (student_id, seat_id, slot_key, booking_date, start_hour, end_hour, status)
SELECT s.id, st.id, 'evening', CURDATE(), 18, 22, 'active'
FROM students s, seats st
WHERE s.mobile = '9876543204' AND st.seat_number = 'C05'
ON DUPLICATE KEY UPDATE status=status;

-- -----------------------------------------------------------------------------
-- SAMPLE PAYMENTS
-- -----------------------------------------------------------------------------
INSERT INTO payments (student_id, membership_id, amount, payment_method, status, transaction_id)
SELECT s.id, m.id, 1499.00, 'upi', 'completed', 'UPI20260907001'
FROM students s
JOIN memberships m ON m.student_id = s.id
JOIN membership_plans p ON p.id = m.plan_id
WHERE s.mobile = '9876543201' AND p.type = 'full_day'
ON DUPLICATE KEY UPDATE status=status;

SELECT '✅ Seed data loaded successfully.' AS result;
