const express = require("express");
const User = require("../models/User");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// ✅ All user routes require authentication
router.use(authenticateUser);

// ✅ Get User Profile
router.get("/profile", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        countryCode: user.country_code,
        preferences:
          typeof user.preferences === "string"
            ? JSON.parse(user.preferences)
            : user.preferences,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Update User Profile
router.put("/profile", async (req, res, next) => {
  try {
    const { name, phone, preferences } = req.body;
    const userId = req.user.userId;

    const updatedUser = await User.updateProfile(userId, {
      name,
      phone,
      preferences,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Set User Location
router.post("/location", async (req, res, next) => {
  try {
    const { countryCode, city, postalCode, coordinates } = req.body;
    const userId = req.user.userId;

    const location = await User.setLocation(userId, {
      countryCode,
      city,
      postalCode,
      coordinates,
    });

    res.json({
      success: true,
      message: "Location updated successfully",
      data: location,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Get User Location
router.get("/location", async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const location = await User.getUserLocation(userId);

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
