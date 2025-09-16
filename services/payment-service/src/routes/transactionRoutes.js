const express = require("express");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// ✅ All transaction routes require user authentication
router.use(authenticateUser);

// ✅ Get Transaction History (Essential for customer experience)
router.get("/user/:userId", async (req, res, next) => {
  try {
    // TODO: Implement transaction history logic
    res.json({
      success: true,
      message: "Transaction history endpoint ready",
      service: "payment-service",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
