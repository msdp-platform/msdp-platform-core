const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { authenticateToken } = require("./middleware/auth");

// Multi-Country Configuration
const countriesConfig = require("../../../config/countries.json");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Multi-Country CORS configuration
const allowedOrigins = [
  "http://localhost:3000", // API Gateway
  "http://localhost:3002", // Admin Dashboard
  "http://localhost:3006", // Merchant Webapp
  "http://localhost:4000", // Global Admin
  // Dynamic country-specific origins
  ...Object.values(countriesConfig.countries).map(
    (country) => `http://localhost:${country.port}`
  ),
];

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || allowedOrigins,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Logging
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    multiCountry: true,
    countries: Object.keys(countriesConfig.countries),
    services: {
      location: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
      merchant: process.env.MERCHANT_SERVICE_URL || "http://localhost:3003",
      delivery: process.env.DELIVERY_SERVICE_URL || "http://localhost:3004",
    },
  });
});

// Country configuration endpoint
app.get("/api/countries", (req, res) => {
  res.status(200).json({
    success: true,
    countries: countriesConfig.countries,
    total: Object.keys(countriesConfig.countries).length,
  });
});

// Specific country configuration
app.get("/api/countries/:countryCode", (req, res) => {
  const { countryCode } = req.params;
  const country = countriesConfig.countries[countryCode];

  if (!country) {
    return res.status(404).json({
      success: false,
      message: `Country '${countryCode}' not found`,
      availableCountries: Object.keys(countriesConfig.countries),
    });
  }

  res.status(200).json({
    success: true,
    country: country,
    countryCode: countryCode,
  });
});

// Country detection middleware
const countryMiddleware = (req, res, next) => {
  // Extract country from request headers, subdomain, or path
  const countryCode =
    req.headers["x-country"] || req.query.country || req.path.split("/")[2]; // /api/usa/... format

  if (countryCode && countriesConfig.countries[countryCode]) {
    req.country = countriesConfig.countries[countryCode];
    req.countryCode = countryCode;
  } else {
    req.country = null;
    req.countryCode = "global";
  }

  next();
};

app.use(countryMiddleware);

// Authentication routes
app.use("/api/auth", authRoutes);

// Multi-country API routes
app.use(
  "/api/:country/auth",
  (req, res, next) => {
    const { country } = req.params;
    if (countriesConfig.countries[country]) {
      req.countryCode = country;
      req.country = countriesConfig.countries[country];
    }
    next();
  },
  authRoutes
);

// Country-specific service routing
Object.keys(countriesConfig.countries).forEach((countryCode) => {
  const country = countriesConfig.countries[countryCode];

  // Country-specific location routing
  app.use(
    `/api/${countryCode}/locations`,
    authenticateToken,
    (req, res, next) => {
      req.headers["x-country"] = countryCode;
      req.headers["x-country-config"] = JSON.stringify(country);
      next();
    },
    createProxyMiddleware({
      target: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${countryCode}/locations`]: "/api/locations",
      },
      onError: (err, req, res) => {
        res.status(503).json({
          error: "Service Unavailable",
          message: `Location service for ${country.name} is currently unavailable`,
          service: "location-service",
          country: countryCode,
        });
      },
    })
  );

  // Country-specific merchant routing
  app.use(
    `/api/${countryCode}/merchants`,
    authenticateToken,
    (req, res, next) => {
      req.headers["x-country"] = countryCode;
      req.headers["x-country-config"] = JSON.stringify(country);
      next();
    },
    createProxyMiddleware({
      target: process.env.MERCHANT_SERVICE_URL || "http://localhost:3003",
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${countryCode}/merchants`]: "/api/merchants",
      },
      onError: (err, req, res) => {
        res.status(503).json({
          error: "Service Unavailable",
          message: `Merchant service for ${country.name} is currently unavailable`,
          service: "merchant-service",
          country: countryCode,
        });
      },
    })
  );
});

// Legacy global service routing (for backward compatibility)
app.use(
  "/api/locations",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/locations": "/api/locations",
    },
    onError: (err, req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Location service is currently unavailable",
        service: "location-service",
      });
    },
  })
);

// Real-time tracking routes (NEW)
app.use(
  "/api/tracking",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/tracking": "/api/tracking",
    },
    onError: (err, req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Real-time tracking service is currently unavailable",
        service: "location-service",
      });
    },
  })
);

// Geospatial routes (NEW)
app.use(
  "/api/geospatial",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/geospatial": "/api/geospatial",
    },
    onError: (err, req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Geospatial service is currently unavailable",
        service: "location-service",
      });
    },
  })
);

app.use(
  "/api/services",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/services": "/api/services",
    },
    onError: (err, req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Location service is currently unavailable",
        service: "location-service",
      });
    },
  })
);

app.use(
  "/api/merchants",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.MERCHANT_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: {
      "^/api/merchants": "/api/merchants",
    },
    onError: (err, req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Merchant service is currently unavailable",
        service: "merchant-service",
      });
    },
  })
);

app.use(
  "/api/delivery",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.DELIVERY_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    pathRewrite: {
      "^/api/delivery": "/api/delivery",
    },
    onError: (err, req, res) => {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Delivery service is currently unavailable",
        service: "delivery-service",
      });
    },
  })
);

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    service: "api-gateway",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Services:`);
  console.log(
    `   - Location: ${
      process.env.LOCATION_SERVICE_URL || "http://localhost:3001"
    }`
  );
  console.log(
    `   - Merchant: ${
      process.env.MERCHANT_SERVICE_URL || "http://localhost:3003"
    }`
  );
  console.log(
    `   - Delivery: ${
      process.env.DELIVERY_SERVICE_URL || "http://localhost:3004"
    }`
  );
});

module.exports = app;
