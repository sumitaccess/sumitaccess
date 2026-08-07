'use strict';

/**
 * Reset and re-seed the Bhoomi Trust data store.
 * Run with: npm run seed
 */
const fs = require('fs');
const path = require('path');
const db = require('./db');

const STORE = path.join(__dirname, '..', 'data', 'store.json');
if (fs.existsSync(STORE)) {
  fs.unlinkSync(STORE);
  console.log('Existing store removed.');
}

// Accessing any data function triggers a fresh seed + persist.
const stats = db.getStats();
console.log('Database seeded:', stats);
console.log('Done. Start the server with: npm start');
