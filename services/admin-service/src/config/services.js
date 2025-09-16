// Service Discovery Configuration for Admin Service
// ✅ Microservice principle: Admin Service communicates via APIs only

const axios = require("axios");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

class ServiceClient {
  constructor() {
    this.services = {
      locationService: {
        baseURL: process.env.LOCATION_SERVICE_URL || "http://localhost:3001",
        timeout: 5000,
      },
      merchantService: {
        baseURL: process.env.MERCHANT_SERVICE_URL || "http://localhost:3002",
        timeout: 5000,
      },
      apiGateway: {
        baseURL: process.env.API_GATEWAY_URL || "http://localhost:3000",
        timeout: 5000,
      },
    };

    // Create axios instances for each service
    this.clients = {};
    Object.entries(this.services).forEach(([serviceName, config]) => {
      this.clients[serviceName] = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "MSDP-Admin-Service/1.0.0",
        },
      });

      // Add response interceptor for logging
      this.clients[serviceName].interceptors.response.use(
        (response) => {
          logger.info(
            `✅ ${serviceName} API call successful: ${response.config.method?.toUpperCase()} ${response.config.url}`
          );
          return response;
        },
        (error) => {
          logger.error(`❌ ${serviceName} API call failed: ${error.message}`);
          return Promise.reject(error);
        }
      );
    });
  }

  // ✅ Location Service API calls
  async getLocationSummary() {
    try {
      const response = await this.clients.locationService.get(
        "/api/locations/countries"
      );
      return response.data;
    } catch (error) {
      logger.error("Failed to get location summary:", error.message);
      return null;
    }
  }

  async enableLocationService(locationId, serviceType) {
    try {
      const response = await this.clients.locationService.post(
        `/api/locations/${locationId}/services`,
        {
          serviceType,
          enabledBy: "admin-service",
        }
      );
      return response.data;
    } catch (error) {
      logger.error("Failed to enable location service:", error.message);
      throw error;
    }
  }

  // ✅ Merchant Service API calls
  async getMerchantSummary() {
    try {
      const response = await this.clients.merchantService.get("/api/merchants");
      return response.data;
    } catch (error) {
      logger.error("Failed to get merchant summary:", error.message);
      return null;
    }
  }

  async approveMerchant(merchantId) {
    try {
      const response = await this.clients.merchantService.put(
        `/api/merchants/${merchantId}/approve`
      );
      return response.data;
    } catch (error) {
      logger.error("Failed to approve merchant:", error.message);
      throw error;
    }
  }

  // ✅ Service Health Monitoring
  async checkServiceHealth() {
    const healthChecks = {};

    for (const [serviceName, client] of Object.entries(this.clients)) {
      try {
        const start = Date.now();
        await client.get("/health");
        healthChecks[serviceName] = {
          status: "healthy",
          responseTime: Date.now() - start,
        };
      } catch (error) {
        healthChecks[serviceName] = {
          status: "unhealthy",
          error: error.message,
        };
      }
    }

    return healthChecks;
  }
}

module.exports = new ServiceClient();
