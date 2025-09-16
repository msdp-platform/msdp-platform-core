const serviceClient = require("../config/services");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// ✅ Admin Service Orchestration Functions
// This controller handles cross-service coordination and data aggregation

class OrchestrationController {
  // ✅ Dashboard Data Aggregation (Microservice way)
  static async getDashboardMetrics(req, res, next) {
    try {
      logger.info("📊 Aggregating dashboard metrics from all services");

      // ✅ Call each service via API (not direct database access)
      const [locationData, merchantData] = await Promise.all([
        serviceClient.getLocationSummary(),
        serviceClient.getMerchantSummary(),
      ]);

      // ✅ Aggregate data (Admin Service responsibility)
      const metrics = {
        locations: {
          totalCountries: locationData?.countries?.length || 0,
          totalCities: locationData?.cities?.length || 0,
          enabledServices: locationData?.enabledServices || 0,
        },
        merchants: {
          total: merchantData?.merchants?.length || 0,
          active:
            merchantData?.merchants?.filter((m) => m.status === "active")
              ?.length || 0,
          pending:
            merchantData?.merchants?.filter((m) => m.status === "pending")
              ?.length || 0,
        },
        platform: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      };

      logger.info("✅ Dashboard metrics aggregated successfully");
      res.json({
        success: true,
        data: metrics,
        aggregatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("❌ Failed to aggregate dashboard metrics:", error.message);
      next(error);
    }
  }

  // ✅ Service Health Monitoring (Admin Service responsibility)
  static async getServiceHealth(req, res, next) {
    try {
      logger.info("🔍 Checking health of all connected services");

      const healthStatus = await serviceClient.checkServiceHealth();

      const overallHealth = Object.values(healthStatus).every(
        (service) => service.status === "healthy"
      );

      res.json({
        success: true,
        overallHealth: overallHealth ? "healthy" : "degraded",
        services: healthStatus,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("❌ Failed to check service health:", error.message);
      next(error);
    }
  }

  // ✅ Merchant Approval Orchestration
  static async approveMerchant(req, res, next) {
    try {
      const { merchantId } = req.params;
      const { notes } = req.body;
      const adminId = req.admin.id;

      logger.info(`🏪 Admin ${adminId} approving merchant ${merchantId}`);

      // ✅ Call Merchant Service to update status (not direct DB access)
      const approvalResult = await serviceClient.approveMerchant(merchantId);

      // ✅ Log admin action (Admin Service responsibility)
      // TODO: Implement audit logging

      res.json({
        success: true,
        message: "Merchant approved successfully",
        data: approvalResult,
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        notes,
      });
    } catch (error) {
      logger.error("❌ Failed to approve merchant:", error.message);
      next(error);
    }
  }

  // ✅ Location Service Enablement Orchestration
  static async enableLocationService(req, res, next) {
    try {
      const { locationId } = req.params;
      const { serviceType, configuration } = req.body;
      const adminId = req.admin.id;

      logger.info(
        `🌍 Admin ${adminId} enabling ${serviceType} for location ${locationId}`
      );

      // ✅ Call Location Service to enable service (not direct DB access)
      const enablementResult = await serviceClient.enableLocationService(
        locationId,
        serviceType
      );

      // ✅ Log admin action
      // TODO: Implement audit logging

      res.json({
        success: true,
        message: "Location service enabled successfully",
        data: enablementResult,
        enabledBy: adminId,
        enabledAt: new Date().toISOString(),
        configuration,
      });
    } catch (error) {
      logger.error("❌ Failed to enable location service:", error.message);
      next(error);
    }
  }

  // ✅ Platform-wide Analytics (Admin Service aggregates from other services)
  static async getPlatformAnalytics(req, res, next) {
    try {
      const { period = "7d" } = req.query;

      logger.info(`📈 Generating platform analytics for period: ${period}`);

      // ✅ Aggregate data from multiple services
      const [locationStats, merchantStats] = await Promise.all([
        serviceClient.getLocationSummary(),
        serviceClient.getMerchantSummary(),
      ]);

      const analytics = {
        period,
        metrics: {
          totalLocations: locationStats?.countries?.length || 0,
          totalMerchants: merchantStats?.merchants?.length || 0,
          platformGrowth: {
            // Calculate growth metrics from aggregated data
            locationsGrowth: "12%", // TODO: Calculate from historical data
            merchantsGrowth: "8%", // TODO: Calculate from historical data
          },
        },
        generatedAt: new Date().toISOString(),
        generatedBy: req.admin.id,
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error("❌ Failed to generate platform analytics:", error.message);
      next(error);
    }
  }
}

module.exports = OrchestrationController;
