require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_CA_PATH && fs.existsSync(process.env.DB_CA_PATH)
        ? { ca: fs.readFileSync(process.env.DB_CA_PATH), minVersion: 'TLSv1.2' }
        : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

console.log("MySQL Pool Created. Waiting for requests...");

// Test connection
promisePool.getConnection()
    .then(connection => {
        console.log("Connected to TiDB successfully!");
        connection.release();
    })
    .catch(err => {
        console.error("Database connection failed:", err.message);
    });

module.exports = promisePool;