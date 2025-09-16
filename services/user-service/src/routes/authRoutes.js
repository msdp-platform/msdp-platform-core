const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const winston = require("winston");

const router = express.Router();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// ✅ Customer Registration
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, phone, countryCode } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      countryCode,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, type: "customer" },
      process.env.JWT_SECRET || "user-service-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Set secure cookie
    res.cookie("msdp_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          countryCode: user.country_code,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Customer Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.authenticate(email, password);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, type: "customer" },
      process.env.JWT_SECRET || "user-service-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Set secure cookie
    res.cookie("msdp_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set user info cookie (non-sensitive)
    res.cookie("msdp_user", user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          countryCode: user.countryCode,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Session Validation
router.get("/session", async (req, res, next) => {
  try {
    const token = req.cookies.msdp_session;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No session found",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "user-service-secret"
    );

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          countryCode: user.country_code,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
});

// ✅ Customer Logout
router.post("/logout", (req, res) => {
  res.clearCookie("msdp_session");
  res.clearCookie("msdp_user");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
