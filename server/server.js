/**
 * ============================================================================
 * StudyHub — Express Application Entry Point
 * ============================================================================
 * 
 * Start dev server:  npm run dev
 * Start prod server: npm start
 * 
 * Ensure .env is configured (copy from .env.example) and MySQL is running
 * with the schema and seed already applied before starting.
 * ============================================================================
 */

'use strict';

// Load environment variables FIRST — before any other require()
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express      = require('express');
const cors         = require('cors');
const path         = require('path');

// Internal
const { testConnection, ensurePaymentGatewayColumns } = require('./config/database');
const { getJwtSecret } = require('./config/auth');
const AdminSettings      = require('./models/AdminSettings');
const errorHandler       = require('./middleware/errorHandler');

// Route modules
const studentsRouter    = require('./routes/students');
const seatsRouter       = require('./routes/seats');
const membershipsRouter = require('./routes/memberships');
const bookingsRouter    = require('./routes/bookings');
const paymentsRouter    = require('./routes/payments');
const attendanceRouter  = require('./routes/attendance');
const plansRouter       = require('./routes/plans');
const adminAuthRouter   = require('./routes/adminAuth');
const settingsRouter    = require('./routes/settings');

// ============================================================================
// Express App Setup
// ============================================================================
const app = express();

// ------------ CORS -----------------------------------------------------------
// Allow the frontend (file:// or localhost) to call the API during development.
// Restrict origins in production via CORS_ORIGIN env variable.
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ------------ Body Parsers ---------------------------------------------------
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buffer) => { req.rawBody = buffer; }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ------------ Static Files (serve frontend) ---------------------------------
// In production you can serve all HTML/CSS/JS from Express directly.
const FRONTEND_ROOT = path.join(__dirname, '..');
app.use(express.static(FRONTEND_ROOT, {
  // Don't serve server/ directory contents as static files
  dotfiles: 'ignore'
}));

// ============================================================================
// API Routes — all prefixed with /api
// ============================================================================
app.use('/api/students',    studentsRouter);
app.use('/api/seats',       seatsRouter);
app.use('/api/memberships', membershipsRouter);
app.use('/api/bookings',    bookingsRouter);
app.use('/api/payments',    paymentsRouter);
app.use('/api/attendance',  attendanceRouter);
app.use('/api/plans',       plansRouter);
app.use('/api/admin',       adminAuthRouter);
app.use('/api/settings',    settingsRouter);

// Health-check endpoint — returns server status + DB connectivity indicator
app.get('/api/health', async (req, res) => {
  res.json({
    success: true,
    service: 'StudyHub API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Catch-all: serve index.html for any unmatched GET (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_ROOT, 'index.html'));
});

// ============================================================================
// Global Error Handler (must be LAST middleware)
// ============================================================================
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  getJwtSecret();
  await AdminSettings.ensureTable();
  await ensurePaymentGatewayColumns();
  // Verify MySQL connection before binding port
  await testConnection();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           StudyHub API Server — Running ✅               ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Local:    http://localhost:${PORT}                         ║`);
    console.log(`║  Health:   http://localhost:${PORT}/api/health               ║`);
    console.log(`║  Seats:    http://localhost:${PORT}/api/seats/availability   ║`);
    console.log(`║  Plans:    http://localhost:${PORT}/api/plans                ║`);
    console.log(`║  Mode:     ${(process.env.NODE_ENV || 'development').padEnd(47)}║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('💥 Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = app; // Export for testing (supertest)
