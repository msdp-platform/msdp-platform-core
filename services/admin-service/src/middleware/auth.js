const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// ✅ Admin Service Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access Denied",
        message: "No admin token provided",
        service: "admin-service",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "admin-service-secret"
    );

    // Get admin user details
    const adminUser = await AdminUser.findById(decoded.id);
    if (!adminUser) {
      return res.status(403).json({
        error: "Invalid Token",
        message: "Admin user not found",
        service: "admin-service",
      });
    }

    // Attach admin user to request
    req.admin = {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      permissions:
        typeof adminUser.permissions === "string"
          ? JSON.parse(adminUser.permissions)
          : adminUser.permissions,
    };

    logger.info(
      `✅ Admin authenticated: ${adminUser.email} (${adminUser.role})`
    );
    next();
  } catch (error) {
    logger.error("❌ Admin authentication failed:", error.message);
    return res.status(403).json({
      error: "Invalid Token",
      message: "Token is invalid or expired",
      service: "admin-service",
    });
  }
};

// ✅ Role-based Access Control for Admin Operations
const requireAdminRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin authentication required",
        service: "admin-service",
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Insufficient admin privileges. Required: ${allowedRoles.join(", ")}`,
        service: "admin-service",
        userRole: req.admin.role,
      });
    }

    next();
  };
};

// ✅ Permission-based Access Control
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin authentication required",
        service: "admin-service",
      });
    }

    const hasPermission =
      req.admin.permissions.includes(permission) ||
      req.admin.role === "super_admin";

    if (!hasPermission) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Permission '${permission}' required`,
        service: "admin-service",
        userPermissions: req.admin.permissions,
      });
    }

    next();
  };
};

module.exports = {
  authenticateAdmin,
  requireAdminRole,
  requirePermission,
};
