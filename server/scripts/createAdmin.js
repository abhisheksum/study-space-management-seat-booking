'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { pool } = require('../config/database');

async function main() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_ROLE } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_FULL_NAME) {
    throw new Error('Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_FULL_NAME before provisioning an admin.');
  }
  if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const id = await Admin.create({
    username: ADMIN_USERNAME,
    passwordHash,
    fullName: ADMIN_FULL_NAME,
    email: ADMIN_EMAIL,
    role: ADMIN_ROLE === 'super' ? 'super' : 'staff'
  });
  console.log(`Created admin account ${ADMIN_USERNAME} (id ${id}).`);
}

main().catch((error) => {
  console.error(`Unable to create admin: ${error.message}`);
  process.exitCode = 1;
}).finally(() => pool.end());
