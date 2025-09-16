const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();

// Import routes
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const trackingRoutes = require("./routes/trackingRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3006;

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

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration for customer frontends
const allowedOrigins = [
  "http://localhost:4001", // Main customer app
  "http://localhost:5001", // USA customer app
  "http://localhost:5002", // India customer app
  "http://localhost:5003", // UK customer app
  "http://localhost:5004", // Singapore customer app
  "http://localhost:3000", // API Gateway
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-ID"],
  })
);

// Rate limiting for order operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Higher limit for order operations
  message: {
    error: "Too Many Requests",
    message: "Too many order requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "msdp-order-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    functions: {
      cartManagement: true,
      orderProcessing: true,
      orderTracking: true,
      orderHistory: true,
      statusManagement: true,
    },
    connectedServices: {
      userService: process.env.USER_SERVICE_URL || "http://localhost:3003",
      merchantService:
        process.env.MERCHANT_SERVICE_URL || "http://localhost:3002",
      paymentService:
        process.env.PAYMENT_SERVICE_URL || "http://localhost:3007",
    },
    supportedCountries: ["usa", "uk", "india", "singapore"],
  });
});

// API Routes
app.use("/api/carts", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tracking", trackingRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "MSDP Order Service",
    version: "1.0.0",
    description: "Cart & Order Management for Customer Experience",
    endpoints: {
      health: "/health",
      carts: "/api/carts",
      orders: "/api/orders",
      tracking: "/api/tracking",
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
    service: "order-service",
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🛒 Order Service running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🎯 Supporting cart management and order processing`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Order Service shut down complete");
    process.exit(0);
  });
});

module.exports = app;
