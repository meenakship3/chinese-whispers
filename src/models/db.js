const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Use different database paths for development vs production
const dbPath = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    ? path.join(__dirname, '../../lockbox.db')  // Development: project root
    : path.join(app.getPath('userData'), 'lockbox.db');  // Production: user data directory

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed", err);
    } else if (process.env.NODE_ENV !== 'test') {
        console.log("Database connected successfully");
    }
});
module.exports = db;