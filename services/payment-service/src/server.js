const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();

// Import routes
const paymentRoutes = require("./routes/paymentRoutes");
const methodRoutes = require("./routes/methodRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3007;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Security middleware (extra security for payment service)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(compression());

// CORS configuration for customer frontends
const allowedOrigins = [
  "http://localhost:4001", // Main customer app
  "http://localhost:5001", // USA customer app
  "http://localhost:5002", // India customer app
  "http://localhost:5003", // UK customer app
  "http://localhost:5004", // Singapore customer app
  "http://localhost:3000", // API Gateway
  "http://localhost:3006", // Order Service
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-ID",
      "X-Order-ID",
    ],
  })
);

// Strict rate limiting for payment operations (security)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for payment operations (security)
  message: {
    error: "Too Many Payment Requests",
    message: "Too many payment attempts from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/payments/process", paymentLimiter);

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", generalLimiter);

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Body parsing
app.use(express.json({ limit: "2mb" })); // Smaller limit for payment service
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "msdp-payment-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    functions: {
      paymentProcessing: true,
      paymentMethodManagement: true,
      transactionManagement: true,
      refundProcessing: true,
      taxCalculation: true,
      discountApplication: true,
    },
    supportedProviders: ["stripe", "paypal", "razorpay"],
    supportedCountries: ["usa", "uk", "india", "singapore"],
    supportedCurrencies: ["USD", "GBP", "INR", "SGD"],
  });
});

// API Routes
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-methods", methodRoutes);
app.use("/api/transactions", transactionRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "MSDP Payment Service",
    version: "1.0.0",
    description: "Payment Processing & Financial Operations",
    endpoints: {
      health: "/health",
      payments: "/api/payments",
      paymentMethods: "/api/payment-methods",
      transactions: "/api/transactions",
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    service: "payment-service",
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`💳 Payment Service running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔒 High-security payment processing enabled`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Payment Service shut down complete");
    process.exit(0);
  });
});

module.exports = app;
