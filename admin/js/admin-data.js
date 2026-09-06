/**
 * StudyHub Admin Console - Central Mock Dataset
 * Contains mock records for:
 * - Students
 * - Seats (A01-C10)
 * - Bookings
 * - Memberships
 * - Payments
 * - Attendance
 * - Center Metrics
 */

const ADMIN_MOCK_DATA = {
  // 1. Core Metrics Summary
  metrics: {
    totalSeats: 30,
    availableSeats: 16,
    occupiedSeats: 11,
    reservedSeats: 3,
    activeMembers: 42,
    todayBookings: 8,
    todayRevenue: "₹14,290",
    expiringMemberships: 5
  },

  // 2. Students List
  students: [
    {
      studentId: "ST-101",
      name: "Priyanshu Verma",
      mobile: "+91 98765 43210",
      email: "priyanshu@gmail.com",
      membership: "Full Day Unlimited",
      seat: "A04",
      slot: "06:00 AM – 11:00 PM",
      expiry: "2026-10-05",
      status: "active"
    },
    {
      studentId: "ST-102",
      name: "Ananya Roy",
      mobile: "+91 98765 43211",
      email: "ananya.roy@outlook.com",
      membership: "Single Slot",
      seat: "A01",
      slot: "Morning (06:00 – 12:00)",
      expiry: "2026-09-28",
      status: "active"
    },
    {
      studentId: "ST-103",
      name: "Rohan Mukherjee",
      mobile: "+91 98765 43212",
      email: "rohan.m@gmail.com",
      membership: "Single Slot",
      seat: "A01",
      slot: "Afternoon (12:00 – 18:00)",
      expiry: "2026-10-02",
      status: "active"
    },
    {
      studentId: "ST-104",
      name: "Meghna Iyer",
      mobile: "+91 98765 43213",
      email: "meghna.iyer@yahoo.com",
      membership: "Half Day",
      seat: "B01",
      slot: "Morning Block (06:00 – 18:00)",
      expiry: "2026-09-12",
      status: "expiring"
    },
    {
      studentId: "ST-105",
      name: "Vikram Malhotra",
      mobile: "+91 98765 43214",
      email: "vikram.m@gmail.com",
      membership: "Full Day Unlimited",
      seat: "B04",
      slot: "06:00 AM – 11:00 PM",
      expiry: "2026-09-09",
      status: "expiring"
    },
    {
      studentId: "ST-106",
      name: "Dr. Rohan Taneja",
      mobile: "+91 98765 43215",
      email: "rohan.taneja@gmail.com",
      membership: "Single Slot",
      seat: "C06",
      slot: "Evening (18:00 – 22:00)",
      expiry: "2026-10-18",
      status: "active"
    },
    {
      studentId: "ST-107",
      name: "Sneha Mukhopadhyay",
      mobile: "+91 98765 43216",
      email: "sneha.m@techcorp.com",
      membership: "Single Slot",
      seat: "C01",
      slot: "Evening (18:00 – 22:00)",
      expiry: "2026-08-30",
      status: "expired"
    }
  ],

  // 3. Seats List (30 Workstations with zones)
  seats: [
    { seatNumber: "A01", zone: "Bay A (Quiet Window)", status: "occupied", assignedStudent: "Ananya Roy (ST-102)", currentSlot: "Morning (06:00 - 12:00)" },
    { seatNumber: "A02", zone: "Bay A (Quiet Window)", status: "occupied", assignedStudent: "Siddharth Sen (ST-108)", currentSlot: "Full Day (06:00 - 23:00)" },
    { seatNumber: "A03", zone: "Bay A (Quiet Window)", status: "reserved", assignedStudent: "Hold (Payment Pending)", currentSlot: "Morning (06:00 - 12:00)" },
    { seatNumber: "A04", zone: "Bay A (Quiet Window)", status: "occupied", assignedStudent: "Priyanshu Verma (ST-101)", currentSlot: "Full Day (06:00 - 23:00)" },
    { seatNumber: "A05", zone: "Bay A (Quiet Window)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "A06", zone: "Bay A (Quiet Window)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "A07", zone: "Bay A (Quiet Window)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "A08", zone: "Bay A (Quiet Window)", status: "occupied", assignedStudent: "Karan Johar (ST-109)", currentSlot: "Afternoon (12:00 - 18:00)" },
    { seatNumber: "A09", zone: "Bay A (Quiet Window)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "A10", zone: "Bay A (Quiet Window)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },

    { seatNumber: "B01", zone: "Bay B (Central Silent)", status: "occupied", assignedStudent: "Meghna Iyer (ST-104)", currentSlot: "Half Day AM (06:00 - 18:00)" },
    { seatNumber: "B02", zone: "Bay B (Central Silent)", status: "reserved", assignedStudent: "Walk-in Trial Hold", currentSlot: "Morning (06:00 - 12:00)" },
    { seatNumber: "B03", zone: "Bay B (Central Silent)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "B04", zone: "Bay B (Central Silent)", status: "occupied", assignedStudent: "Vikram Malhotra (ST-105)", currentSlot: "Full Day (06:00 - 23:00)" },
    { seatNumber: "B05", zone: "Bay B (Central Silent)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "B06", zone: "Bay B (Central Silent)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "B07", zone: "Bay B (Central Silent)", status: "occupied", assignedStudent: "Divya Nambiar (ST-110)", currentSlot: "Afternoon (12:00 - 18:00)" },
    { seatNumber: "B08", zone: "Bay B (Central Silent)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "B09", zone: "Bay B (Central Silent)", status: "occupied", assignedStudent: "Ayush Gupta (ST-111)", currentSlot: "Full Day (06:00 - 23:00)" },
    { seatNumber: "B10", zone: "Bay B (Central Silent)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },

    { seatNumber: "C01", zone: "Bay C (Aspirant Hall)", status: "occupied", assignedStudent: "Ritesh Joshi (ST-112)", currentSlot: "Afternoon (12:00 - 18:00)" },
    { seatNumber: "C02", zone: "Bay C (Aspirant Hall)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "C03", zone: "Bay C (Aspirant Hall)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "C04", zone: "Bay C (Aspirant Hall)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "C05", zone: "Bay C (Aspirant Hall)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "C06", zone: "Bay C (Aspirant Hall)", status: "occupied", assignedStudent: "Dr. Rohan Taneja (ST-106)", currentSlot: "Evening (18:00 - 22:00)" },
    { seatNumber: "C07", zone: "Bay C (Aspirant Hall)", status: "reserved", assignedStudent: "Offline Admission Hold", currentSlot: "Morning (06:00 - 12:00)" },
    { seatNumber: "C08", zone: "Bay C (Aspirant Hall)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "C09", zone: "Bay C (Aspirant Hall)", status: "available", assignedStudent: "--", currentSlot: "Unassigned" },
    { seatNumber: "C10", zone: "Bay C (Aspirant Hall)", status: "occupied", assignedStudent: "Pooja Hegde (ST-114)", currentSlot: "Full Day (06:00 - 23:00)" }
  ],

  // 4. Bookings
  bookings: [
    { bookingId: "BK-8021", student: "Priyanshu Verma", studentId: "ST-101", seat: "A04", date: "2026-09-07", slot: "Full Day (06:00 - 23:00)", status: "confirmed" },
    { bookingId: "BK-8022", student: "Ananya Roy", studentId: "ST-102", seat: "A01", date: "2026-09-07", slot: "Morning (06:00 - 12:00)", status: "confirmed" },
    { bookingId: "BK-8023", student: "Rohan Mukherjee", studentId: "ST-103", seat: "A01", date: "2026-09-07", slot: "Afternoon (12:00 - 18:00)", status: "confirmed" },
    { bookingId: "BK-8024", student: "Meghna Iyer", studentId: "ST-104", seat: "B01", date: "2026-09-07", slot: "Half Day AM (06:00 - 18:00)", status: "confirmed" },
    { bookingId: "BK-8025", student: "Vikram Malhotra", studentId: "ST-105", seat: "B04", date: "2026-09-07", slot: "Full Day (06:00 - 23:00)", status: "confirmed" },
    { bookingId: "BK-8026", student: "Dr. Rohan Taneja", studentId: "ST-106", seat: "C06", date: "2026-09-07", slot: "Evening (18:00 - 22:00)", status: "confirmed" },
    { bookingId: "BK-8027", student: "Aman Preet", studentId: "ST-115", seat: "A03", date: "2026-09-07", slot: "Morning (06:00 - 12:00)", status: "pending" }
  ],

  // 5. Payment Records
  payments: [
    { txnId: "TXN-94820", student: "Priyanshu Verma", amount: "₹1,699", date: "2026-09-05", method: "UPI / PhonePe", plan: "Full Day Unlimited", status: "paid" },
    { txnId: "TXN-94821", student: "Ananya Roy", amount: "₹899", date: "2026-08-28", method: "Credit Card", plan: "Single Slot", status: "paid" },
    { txnId: "TXN-94822", student: "Rohan Mukherjee", amount: "₹849", date: "2026-09-02", method: "UPI / GPay", plan: "Single Slot", status: "paid" },
    { txnId: "TXN-94823", student: "Meghna Iyer", amount: "₹1,349", date: "2026-08-12", method: "Net Banking", plan: "Half Day", status: "paid" },
    { txnId: "TXN-94824", student: "Aman Preet", amount: "₹899", date: "2026-09-07", method: "Cash at Desk", plan: "Single Slot", status: "pending" }
  ],

  // 6. Attendance Logs
  attendance: [
    { student: "Priyanshu Verma", seat: "A04", checkIn: "06:12 AM", checkOut: "In Center", status: "present" },
    { student: "Ananya Roy", seat: "A01", checkIn: "06:05 AM", checkOut: "11:58 AM", status: "completed" },
    { student: "Rohan Mukherjee", seat: "A01", checkIn: "12:10 PM", checkOut: "In Center", status: "present" },
    { student: "Meghna Iyer", seat: "B01", checkIn: "06:30 AM", checkOut: "In Center", status: "present" },
    { student: "Vikram Malhotra", seat: "B04", checkIn: "08:15 AM", checkOut: "In Center", status: "present" },
    { student: "Dr. Rohan Taneja", seat: "C06", checkIn: "Expected 18:00", checkOut: "--", status: "upcoming" }
  ]
};

// Global export
if (typeof window !== 'undefined') {
  window.ADMIN_MOCK_DATA = ADMIN_MOCK_DATA;
}
