const jwt = require("jsonwebtoken");
const Joi = require("joi");
const Merchant = require("../models/Merchant");

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
});

const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/),
  address: Joi.string().max(500),
  business_type: Joi.string()
    .valid(
      // VendaBuddy Service Categories
      "food_service",        // Restaurants, street food, catering
      "home_service",        // Cleaning, repairs, maintenance
      "digital_service",     // Design, development, marketing
      "professional_service", // Consulting, training, coaching
      "logistics",           // Transport, delivery, moving
      "creative_service",    // Photography, events, content
      // Legacy support
      "restaurant", "cafe", "bakery", "food_truck", "catering"
    )
    .default("food_service"),
  description: Joi.string().max(1000),
  country: Joi.string().valid("GB", "IN", "US", "SG").default("GB"),
});

// Generate JWT token
const generateToken = (merchantId) => {
  return jwt.sign(
    { merchant_id: merchantId },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
};

// Login merchant
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { email, password } = value;
    const merchant = await Merchant.verifyPassword(email, password);

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (merchant.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact support.",
      });
    }

    const token = generateToken(merchant.id);

    // Remove password hash from response
    const { password_hash, ...merchantData } = merchant;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        merchant: merchantData,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Register new merchant
const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Check if merchant already exists
    const existingMerchant = await Merchant.findByEmail(value.email);
    if (existingMerchant) {
      return res.status(409).json({
        success: false,
        message: "Merchant with this email already exists",
      });
    }

    const merchant = await Merchant.create(value);
    const token = generateToken(merchant.id);

    res.status(201).json({
      success: true,
      message: "Merchant registered successfully",
      data: {
        merchant,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Get current merchant profile
const getProfile = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.user.merchant_id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    res.json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// Update merchant profile
const updateProfile = async (req, res) => {
  try {
    const updateSchema = registerSchema.fork(["email", "password"], (schema) =>
      schema.optional()
    );
    const { error, value } = updateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const updatedMerchant = await Merchant.update(req.user.merchant_id, value);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedMerchant,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const stats = await Merchant.getDashboardStats(req.user.merchant_id);

    res.json({
      success: true,
      data: {
        totalProducts: parseInt(stats.total_products) || 0,
        activeProducts: parseInt(stats.active_products) || 0,
        inventoryValue: parseFloat(stats.inventory_value) || 0,
        totalCustomers: parseInt(stats.total_customers) || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  getDashboardStats,
};
