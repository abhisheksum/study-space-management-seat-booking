'use strict';

const jwtSecret = process.env.JWT_SECRET;

function getJwtSecret() {
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return jwtSecret;
}

module.exports = {
  getJwtSecret,
  tokenTtl: process.env.JWT_EXPIRES_IN || '8h'
};
