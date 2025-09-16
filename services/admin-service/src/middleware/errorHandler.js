const winston = require("winston");

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log" }),
    new winston.transports.Console(),
  ],
});

// ✅ Admin Service Error Handler
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error("Admin Service Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    adminUser: req.admin?.email || "unauthenticated",
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = 500;
  let message = "Internal Server Error";

  // Handle specific error types
  if (err.message.includes("Invalid credentials")) {
    statusCode = 401;
    message = "Authentication failed";
  } else if (err.message.includes("not found")) {
    statusCode = 404;
    message = "Resource not found";
  } else if (err.message.includes("already exists")) {
    statusCode = 409;
    message = "Resource already exists";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
  }

  res.status(statusCode).json({
    error: true,
    message: message,
    service: "admin-service",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
