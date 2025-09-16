const jwt = require("jsonwebtoken");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// ✅ Customer User Authentication Middleware (for Payment Service)
const authenticateUser = (req, res, next) => {
  try {
    // Try to get token from Authorization header (API calls)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access Denied",
        message: "No authentication token provided",
        service: "payment-service",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "user-service-secret" // Same secret as User Service
    );

    // Ensure this is a customer token
    if (decoded.type !== "customer") {
      return res.status(403).json({
        error: "Invalid Token Type",
        message: "Customer authentication required",
        service: "payment-service",
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type,
    };

    logger.info(`✅ Customer authenticated for payment: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error("❌ Payment service authentication failed:", error.message);
    return res.status(403).json({
      error: "Invalid Token",
      message: "Token is invalid or expired",
      service: "payment-service",
    });
  }
};

module.exports = {
  authenticateUser,
};
