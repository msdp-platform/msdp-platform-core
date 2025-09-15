const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");

// Multi-Country Configuration
const countriesConfig = require("../../../config/countries.json");

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3006", "http://localhost:3000"],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(morgan("combined"));

// Country detection middleware
const countryMiddleware = (req, res, next) => {
  const countryCode = req.headers["x-country"] || "global";
  const countryConfig = req.headers["x-country-config"];

  if (countryCode !== "global" && countriesConfig.countries[countryCode]) {
    req.country = countriesConfig.countries[countryCode];
    req.countryCode = countryCode;
    req.dbPrefix = `msdp_${countryCode}`;
  } else {
    req.country = null;
    req.countryCode = "global";
    req.dbPrefix = "msdp";
  }

  next();
};

app.use(countryMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "merchant-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    multiCountry: true,
    supportedCountries: Object.keys(countriesConfig.countries),
    currentCountry: req.countryCode || "global",
  });
});

// Country-specific merchant endpoints
app.get("/api/merchants/countries", (req, res) => {
  res.json({
    success: true,
    countries: Object.keys(countriesConfig.countries),
    configurations: countriesConfig.countries,
  });
});

app.get("/api/merchants/country/:countryCode", (req, res) => {
  const { countryCode } = req.params;
  const country = countriesConfig.countries[countryCode];

  if (!country) {
    return res.status(404).json({
      success: false,
      message: `Country '${countryCode}' not supported`,
      supportedCountries: Object.keys(countriesConfig.countries),
    });
  }

  res.json({
    success: true,
    country: country,
    features: country.features,
    paymentMethods: country.payment_methods,
    compliance: country.compliance,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`🚀 Merchant Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = app;
