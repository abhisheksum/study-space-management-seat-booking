-- =============================================================================
-- StudyHub — Complete Database Schema
-- MySQL 8.0+ compatible
-- =============================================================================
-- Run: mysql -u root -p < server/database/schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS studyhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE studyhub;

-- =============================================================================
-- 1. ADMINS
-- =============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  username      VARCHAR(60)       NOT NULL UNIQUE,
  password_hash VARCHAR(255)      NOT NULL,          -- bcrypt hash
  full_name     VARCHAR(120)      NOT NULL,
  email         VARCHAR(120)               UNIQUE,
  role          ENUM('super','staff')      NOT NULL DEFAULT 'staff',
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. TIME SLOTS  (master list — configurable from admin panel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS time_slots (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80)       NOT NULL,          -- "Morning Shift"
  slot_key      VARCHAR(30)       NOT NULL UNIQUE,   -- "morning", "afternoon", "evening", "full-day"
  start_hour    TINYINT UNSIGNED  NOT NULL,           -- 6
  end_hour      TINYINT UNSIGNED  NOT NULL,           -- 12
  label         VARCHAR(60)       NOT NULL,           -- "06:00 AM – 12:00 PM"
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CHECK (end_hour > start_hour),
  CHECK (start_hour >= 0 AND end_hour <= 24)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. MEMBERSHIP PLANS  (pricing is admin-controlled, not hardcoded in frontend)
-- =============================================================================
CREATE TABLE IF NOT EXISTS membership_plans (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80)       NOT NULL,           -- "Full Day Pass"
  type          ENUM('full_day','half_day','slot') NOT NULL,
  slot_id       INT UNSIGNED               DEFAULT NULL,  -- FK → time_slots (null for full/half day)
  price         DECIMAL(8,2)      NOT NULL,           -- monthly price (INR)
  duration_days INT UNSIGNED      NOT NULL DEFAULT 30, -- membership validity in days
  description   TEXT,
  features      JSON,                                  -- ["WiFi","Charging point","CCTV",...]
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_plan_slot FOREIGN KEY (slot_id) REFERENCES time_slots (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. SEATS  (physical workstations A01–C10)
-- =============================================================================
CREATE TABLE IF NOT EXISTS seats (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  seat_number   VARCHAR(10)       NOT NULL UNIQUE,   -- "A01", "B05", "C10"
  zone          CHAR(1)           NOT NULL,           -- 'A', 'B', 'C'
  row_position  TINYINT UNSIGNED  NOT NULL,           -- 1-10
  status        ENUM('active','maintenance','inactive') NOT NULL DEFAULT 'active',
  notes         VARCHAR(255)               DEFAULT NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. STUDENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS students (
  id                       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name                VARCHAR(120)  NOT NULL,
  mobile                   VARCHAR(15)   NOT NULL UNIQUE,
  email                    VARCHAR(120)           UNIQUE,
  date_of_birth            DATE,
  gender                   ENUM('male','female','other','prefer_not_to_say'),
  address                  TEXT,
  city                     VARCHAR(80),
  state                    VARCHAR(80),
  pincode                  VARCHAR(10),
  student_id_no            VARCHAR(60),            -- College/University ID
  emergency_contact_name   VARCHAR(120),
  emergency_contact_mobile VARCHAR(15),
  emergency_contact_rel    VARCHAR(60),            -- "Father", "Mother", etc.
  profile_photo_path       VARCHAR(255),           -- relative path to uploaded file
  password_hash            VARCHAR(255),           -- bcrypt hash for student portal login
  is_active                TINYINT(1)   NOT NULL DEFAULT 1,
  registered_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_mobile (mobile),
  INDEX idx_email  (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. MEMBERSHIPS  (a student's active subscription to a plan + assigned seat)
-- =============================================================================
CREATE TABLE IF NOT EXISTS memberships (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  student_id    INT UNSIGNED      NOT NULL,
  plan_id       INT UNSIGNED      NOT NULL,
  seat_id       INT UNSIGNED      NOT NULL,
  start_date    DATE              NOT NULL,
  end_date      DATE              NOT NULL,
  status        ENUM('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_mem_student  FOREIGN KEY (student_id) REFERENCES students (id)         ON DELETE CASCADE,
  CONSTRAINT fk_mem_plan     FOREIGN KEY (plan_id)    REFERENCES membership_plans (id) ON DELETE RESTRICT,
  CONSTRAINT fk_mem_seat     FOREIGN KEY (seat_id)    REFERENCES seats (id)            ON DELETE RESTRICT,
  INDEX idx_mem_student (student_id),
  INDEX idx_mem_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. BOOKINGS  (per-day seat reservations — ANTI-OVERLAP ENFORCED HERE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  membership_id INT UNSIGNED               DEFAULT NULL,   -- nullable: walk-in bookings
  student_id    INT UNSIGNED      NOT NULL,
  seat_id       INT UNSIGNED      NOT NULL,
  slot_key      VARCHAR(30)       NOT NULL,                 -- "morning", "full-day", etc.
  booking_date  DATE              NOT NULL,
  start_hour    TINYINT UNSIGNED  NOT NULL,                 -- copy from time_slot for fast overlap math
  end_hour      TINYINT UNSIGNED  NOT NULL,
  status        ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  notes         VARCHAR(255)               DEFAULT NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_bk_membership FOREIGN KEY (membership_id) REFERENCES memberships (id) ON DELETE SET NULL,
  CONSTRAINT fk_bk_student    FOREIGN KEY (student_id)    REFERENCES students (id)    ON DELETE CASCADE,
  CONSTRAINT fk_bk_seat       FOREIGN KEY (seat_id)       REFERENCES seats (id)       ON DELETE RESTRICT,
  INDEX idx_bk_seat_date (seat_id, booking_date),
  INDEX idx_bk_student   (student_id),
  INDEX idx_bk_date      (booking_date)
  -- Note: Application-level overlap check is enforced in bookingController before INSERT.
  -- The composite index on (seat_id, booking_date) makes this check fast.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. PAYMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  student_id      INT UNSIGNED    NOT NULL,
  membership_id   INT UNSIGNED             DEFAULT NULL,
  amount          DECIMAL(10,2)   NOT NULL,
  payment_method  ENUM('cash','upi','card','bank_transfer','online') NOT NULL DEFAULT 'cash',
  status          ENUM('pending','completed','failed','refunded')    NOT NULL DEFAULT 'pending',
  transaction_id  VARCHAR(100)             UNIQUE DEFAULT NULL,      -- UPI ref, card auth etc.
  gateway_order_id VARCHAR(100)             UNIQUE DEFAULT NULL,
  gateway_signature VARCHAR(255)             DEFAULT NULL,
  payment_date    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes           VARCHAR(255)             DEFAULT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pay_student    FOREIGN KEY (student_id)    REFERENCES students (id)    ON DELETE CASCADE,
  CONSTRAINT fk_pay_membership FOREIGN KEY (membership_id) REFERENCES memberships (id) ON DELETE SET NULL,
  INDEX idx_pay_student    (student_id),
  INDEX idx_pay_date       (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. ATTENDANCE
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  student_id      INT UNSIGNED    NOT NULL,
  seat_id         INT UNSIGNED    NOT NULL,
  booking_id      INT UNSIGNED             DEFAULT NULL,
  slot_key        VARCHAR(30)     NOT NULL,
  booking_date    DATE            NOT NULL,
  check_in_time   DATETIME                 DEFAULT NULL,
  check_out_time  DATETIME                 DEFAULT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
  CONSTRAINT fk_att_seat    FOREIGN KEY (seat_id)    REFERENCES seats (id)    ON DELETE RESTRICT,
  CONSTRAINT fk_att_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
  INDEX idx_att_student_date (student_id, booking_date),
  INDEX idx_att_date         (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL,
  mobile      VARCHAR(15) NOT NULL,
  subject     VARCHAR(80) NOT NULL,
  message     TEXT NOT NULL,
  status      ENUM('new','in_progress','resolved','spam') NOT NULL DEFAULT 'new',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_contact_status (status),
  INDEX idx_contact_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
