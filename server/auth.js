'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bhoomi-trust-dev-secret-please-change';
const COOKIE_NAME = 'bt_token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(String(password), salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    if (!stored || typeof stored !== 'string' || stored.indexOf(':') === -1) return resolve(false);
    const [salt, hash] = stored.split(':');
    if (!salt || !hash || hash.length !== 128) return resolve(false);
    crypto.scrypt(String(password), salt, 64, (err, derived) => {
      if (err) return reject(err);
      try {
        resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived));
      } catch (e) {
        resolve(false);
      }
    });
  });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE + 's' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function setAuthCookie(res, payload) {
  const token = signToken(payload);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_MAX_AGE * 1000
  });
  return token;
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.user = decoded;
  next();
}

module.exports = {
  JWT_SECRET,
  COOKIE_NAME,
  TOKEN_MAX_AGE,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth
};
