const jwt = require("jsonwebtoken");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// ✅ Customer User Authentication Middleware
const authenticateUser = (req, res, next) => {
  try {
    // Try to get token from cookie first (for web apps)
    let token = req.cookies.msdp_session;

    // If no cookie, try Authorization header (for mobile apps)
    if (!token) {
      const authHeader = req.headers["authorization"];
      token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        error: "Access Denied",
        message: "No authentication token provided",
        service: "user-service",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "user-service-secret"
    );

    // Ensure this is a customer token
    if (decoded.type !== "customer") {
      return res.status(403).json({
        error: "Invalid Token Type",
        message: "Customer authentication required",
        service: "user-service",
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type,
    };

    logger.info(`✅ Customer authenticated: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error("❌ Customer authentication failed:", error.message);
    return res.status(403).json({
      error: "Invalid Token",
      message: "Token is invalid or expired",
      service: "user-service",
    });
  }
};

// ✅ Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies.msdp_session;

    if (!token) {
      const authHeader = req.headers["authorization"];
      token = authHeader && authHeader.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "user-service-secret"
      );

      if (decoded.type === "customer") {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          type: decoded.type,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
};
