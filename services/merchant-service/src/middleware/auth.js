const jwt = require("jsonwebtoken");
const Merchant = require("../models/Merchant");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );
    const merchant = await Merchant.findById(decoded.merchant_id);

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: "Invalid token - merchant not found",
      });
    }

    if (merchant.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }

    req.user = {
      merchant_id: merchant.id,
      email: merchant.email,
      name: merchant.name,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

module.exports = authMiddleware;
