const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5437,
  database: process.env.DB_NAME || "msdp_orders",
  user: process.env.DB_USER || "msdp_user",
  password: process.env.DB_PASSWORD || "msdp_password",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on("connect", () => {
  console.log("💾 Order Service connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("💥 Order Service database connection error:", err);
  process.exit(-1);
});

// Test the connection
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("❌ Order Service database connection test failed:", err);
  } else {
    console.log(
      "✅ Order Service database connection test successful:",
      result.rows[0]
    );
  }
});

module.exports = pool;
