const express = require("express");
const router = express.Router();
const orchestrationController = require("../controllers/orchestrationController");
const { authenticateAdmin } = require("../middleware/auth");

// ✅ All orchestration routes require admin authentication
router.use(authenticateAdmin);

// ✅ Dashboard Data Aggregation
router.get("/dashboard-metrics", orchestrationController.getDashboardMetrics);

// ✅ Service Health Monitoring
router.get("/service-health", orchestrationController.getServiceHealth);

// ✅ Platform Analytics
router.get("/analytics", orchestrationController.getPlatformAnalytics);

// ✅ Merchant Approval Orchestration
router.post(
  "/merchants/:merchantId/approve",
  orchestrationController.approveMerchant
);

// ✅ Location Service Enablement Orchestration
router.post(
  "/locations/:locationId/enable-service",
  orchestrationController.enableLocationService
);

module.exports = router;
