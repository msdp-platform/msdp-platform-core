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

// ✅ Payment Service Error Handler
const errorHandler = (err, req, res, next) => {
  // Log the error (extra logging for payment service)
  logger.error("Payment Service Error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.email || "unauthenticated",
    timestamp: new Date().toISOString(),
    severity: "high", // Payment errors are high severity
  });

  // Default error response
  let statusCode = 500;
  let message = "Payment processing error";

  // Handle specific error types
  if (err.message.includes("payment failed")) {
    statusCode = 402;
    message = "Payment failed";
  } else if (err.message.includes("insufficient funds")) {
    statusCode = 402;
    message = "Insufficient funds";
  } else if (err.message.includes("invalid card")) {
    statusCode = 400;
    message = "Invalid payment method";
  } else if (err.message.includes("not found")) {
    statusCode = 404;
    message = "Payment method not found";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid payment data";
  }

  res.status(statusCode).json({
    error: true,
    message: message,
    service: "payment-service",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
    }),
    // Never expose sensitive payment details in error responses
  });
};

module.exports = errorHandler;
