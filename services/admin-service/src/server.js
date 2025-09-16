const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();

// Import routes
const adminUserRoutes = require("./routes/adminUserRoutes");
const platformRoutes = require("./routes/platformRoutes");
const orchestrationRoutes = require("./routes/orchestrationRoutes");
const auditRoutes = require("./routes/auditRoutes");

// Import middleware
const authMiddleware = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3005;

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

// CORS configuration
const allowedOrigins = [
  "http://localhost:4000", // Admin Dashboard
  "http://localhost:3000", // API Gateway
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Role"],
  })
);

// Rate limiting for admin operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: {
    error: "Too Many Requests",
    message: "Too many admin requests from this IP, please try again later.",
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "msdp-admin-service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    functions: {
      adminUserManagement: true,
      platformConfiguration: true,
      serviceOrchestration: true,
      auditLogging: true,
      crossServiceAggregation: true,
    },
    connectedServices: {
      locationService:
        process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
      merchantService:
        process.env.MERCHANT_SERVICE_URL || "http://localhost:3002",
      apiGateway: process.env.API_GATEWAY_URL || "http://localhost:3000",
    },
  });
});

// API Routes
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/platform", platformRoutes);
app.use("/api/admin/orchestration", orchestrationRoutes);
app.use("/api/admin/audit", auditRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "MSDP Admin Service",
    version: "1.0.0",
    description: "Platform Management & Service Orchestration",
    endpoints: {
      health: "/health",
      adminUsers: "/api/admin/users",
      platform: "/api/admin/platform",
      orchestration: "/api/admin/orchestration",
      audit: "/api/admin/audit",
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
    service: "admin-service",
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🎛️ Admin Service running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(
    `🔗 Connected services: Location(${process.env.LOCATION_SERVICE_URL}), Merchant(${process.env.MERCHANT_SERVICE_URL})`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Admin Service shut down complete");
    process.exit(0);
  });
});

module.exports = app;
