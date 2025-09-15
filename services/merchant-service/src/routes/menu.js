const express = require("express");
const menuController = require("../controllers/menuController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// All menu routes require authentication
router.use(authMiddleware);

// Menu CRUD routes
router.get("/", menuController.getMenuItems);
router.post("/", menuController.createMenuItem);
router.get("/stats", menuController.getMenuStats);
router.get("/:id", menuController.getMenuItem);
router.put("/:id", menuController.updateMenuItem);
router.delete("/:id", menuController.deleteMenuItem);

module.exports = router;
