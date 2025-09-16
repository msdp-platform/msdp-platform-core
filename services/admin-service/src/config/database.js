const { Pool } = require("pg");
const winston = require("winston");
require("dotenv").config();

// Logger for database operations
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Admin Service Database Configuration
// ✅ ONLY owns admin-specific data
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "msdp_admin",
  user: process.env.DB_USER || "msdp_user",
  password: process.env.DB_PASSWORD || "msdp_password",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database connection events
pool.on("connect", () => {
  logger.info("🎛️ Admin Service connected to PostgreSQL database");
});

pool.on("error", (err) => {
  logger.error("❌ Admin Service database connection error:", err);
});

// Test connection on startup
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    logger.error("❌ Admin Service database test query failed:", err);
  } else {
    logger.info("✅ Admin Service database connection verified");
  }
});

module.exports = pool;
