const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const serviceController = require("../controllers/serviceController");

// Service Categories
router.get("/categories", serviceController.getServiceCategories);
router.post(
  "/categories",
  requireRole(["admin", "super_admin"]),
  serviceController.createServiceCategory
);
router.put(
  "/categories/:id",
  requireRole(["admin", "super_admin"]),
  serviceController.updateServiceCategory
);
router.delete(
  "/categories/:id",
  requireRole(["super_admin"]),
  serviceController.deleteServiceCategory
);

// Service Enablement Status
router.get("/enablement-status", serviceController.getServiceEnablementStatus);
router.get(
  "/enablement-status/:cityId",
  serviceController.getCityServiceEnablementStatus
);

module.exports = router;
