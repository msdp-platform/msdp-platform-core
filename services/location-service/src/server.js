const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const locationRoutes = require("./routes/locationRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { authenticateToken } = require("./middleware/auth");

// Multi-Country Configuration
const countriesConfig = require("../../../config/countries.json");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3002",
    ],
    credentials: true,
  })
);

// Logging
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
  res.status(200).json({
    status: "healthy",
    service: "location-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    multiCountry: true,
    supportedCountries: Object.keys(countriesConfig.countries),
    currentCountry: req.countryCode || "global",
  });
});

// Country-specific endpoints
app.get("/api/countries", (req, res) => {
  res.status(200).json({
    success: true,
    countries: Object.keys(countriesConfig.countries),
    configurations: countriesConfig.countries,
  });
});

// API routes
app.use("/api/locations", authenticateToken, locationRoutes);
app.use("/api/services", authenticateToken, serviceRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    service: "location-service",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Location Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
