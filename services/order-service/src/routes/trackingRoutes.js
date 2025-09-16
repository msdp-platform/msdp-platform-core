const express = require("express");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// ✅ Track Order (Essential for customer experience)
router.get("/:orderId", authenticateUser, async (req, res, next) => {
  try {
    // TODO: Implement order tracking logic
    res.json({
      success: true,
      message: "Order tracking endpoint ready",
      service: "order-service",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
