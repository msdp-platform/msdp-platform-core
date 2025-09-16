const express = require("express");
const router = express.Router();
const { authenticateAdmin, requireAdminRole } = require("../middleware/auth");
const pool = require("../config/database");

// ✅ Platform Settings Management (Admin Service owns this)
router.get("/settings", authenticateAdmin, async (req, res, next) => {
  try {
    const query = "SELECT * FROM platform_settings ORDER BY setting_key";
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
