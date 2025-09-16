const express = require("express");
const User = require("../models/User");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// ✅ All profile routes require authentication
router.use(authenticateUser);

// ✅ Get User Preferences
router.get("/preferences", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    const preferences =
      typeof user.preferences === "string"
        ? JSON.parse(user.preferences)
        : user.preferences;

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Update User Preferences
router.put("/preferences", async (req, res, next) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.userId;

    const updatedUser = await User.updateProfile(userId, { preferences });

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: updatedUser.preferences,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
