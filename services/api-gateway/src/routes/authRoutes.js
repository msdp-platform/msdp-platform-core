const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const router = express.Router();

// Mock admin users (in production, this would be in a database)
const adminUsers = [
  {
    id: 1,
    email: "admin@msdp.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    name: "Admin User",
    role: "admin",
  },
  {
    id: 2,
    email: "superadmin@msdp.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    name: "Super Admin",
    role: "super_admin",
  },
];

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Login endpoint
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: error.details[0].message,
      });
    }

    const { email, password } = value;

    // Find user
    const user = adminUsers.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication Failed",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Authentication Failed",
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
});

// Verify token endpoint
router.get("/verify", async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No Token",
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    res.json({
      success: true,
      data: {
        user: decoded,
      },
      message: "Token is valid",
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid Token",
        message: "Token is invalid",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token Expired",
        message: "Token has expired",
      });
    }
    next(error);
  }
});

// Logout endpoint (client-side token removal)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout successful",
  });
});

module.exports = router;
