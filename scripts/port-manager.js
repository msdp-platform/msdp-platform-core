#!/usr/bin/env node

// MSDP Platform - Centralized Port Management Utility
// Usage: node scripts/port-manager.js [command] [service]

const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../config/platform-config.json");

class PortManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configContent = fs.readFileSync(CONFIG_PATH, "utf8");
      return JSON.parse(configContent);
    } catch (error) {
      console.error("❌ Failed to load platform config:", error.message);
      process.exit(1);
    }
  }

  getServicePort(serviceName) {
    const services = this.config.ports.services;
    const frontends = this.config.ports.frontends;
    const countries = this.config.ports.countries;

    if (services[serviceName]) {
      return services[serviceName];
    }
    if (frontends[serviceName]) {
      return frontends[serviceName];
    }
    if (countries[serviceName]) {
      return countries[serviceName];
    }
    return null;
  }

  getAllPorts() {
    const allPorts = [];

    // Collect all ports from services
    Object.entries(this.config.ports.services).forEach(([service, ports]) => {
      Object.entries(ports).forEach(([type, port]) => {
        allPorts.push({ service, type, port, category: "Backend Service" });
      });
    });

    // Collect all ports from frontends
    Object.entries(this.config.ports.frontends).forEach(([service, ports]) => {
      Object.entries(ports).forEach(([type, port]) => {
        allPorts.push({ service, type, port, category: "Frontend App" });
      });
    });

    // Collect all ports from countries
    Object.entries(this.config.ports.countries).forEach(([country, ports]) => {
      Object.entries(ports).forEach(([type, port]) => {
        allPorts.push({
          service: `${country}-${type}`,
          type,
          port,
          category: "Country-Specific",
        });
      });
    });

    return allPorts.sort((a, b) => a.port - b.port);
  }

  checkPortConflicts() {
    const allPorts = this.getAllPorts();
    const portMap = new Map();
    const conflicts = [];

    allPorts.forEach(({ service, type, port, category }) => {
      const key = `${service}-${type}`;
      if (portMap.has(port)) {
        conflicts.push({
          port,
          conflict: [portMap.get(port), { service, type, category }],
        });
      } else {
        portMap.set(port, { service, type, category });
      }
    });

    return conflicts;
  }

  generateDockerCompose(serviceName) {
    const serviceConfig = this.getServicePort(serviceName);
    if (!serviceConfig) {
      console.error(`❌ Service '${serviceName}' not found in configuration`);
      return null;
    }

    return {
      service: serviceConfig.service || 3000,
      postgres: serviceConfig.postgres || null,
      redis: serviceConfig.redis || null,
      pgadmin: serviceConfig.pgadmin || null,
      "redis-commander": serviceConfig["redis-commander"] || null,
    };
  }

  showPortMap() {
    console.log("📋 MSDP Platform - Port Allocation Map");
    console.log("=====================================");
    console.log("");

    const allPorts = this.getAllPorts();
    const categories = [...new Set(allPorts.map((p) => p.category))];

    categories.forEach((category) => {
      console.log(`🔧 ${category}:`);
      const categoryPorts = allPorts.filter((p) => p.category === category);
      categoryPorts.forEach(({ service, type, port }) => {
        const typeLabel = type === "service" ? "" : ` (${type})`;
        console.log(`  ${service}${typeLabel}: ${port}`);
      });
      console.log("");
    });

    // Show port ranges
    console.log("📊 Port Ranges:");
    Object.entries(this.config.ports.ranges).forEach(([range, ports]) => {
      console.log(`  ${range}: ${ports}`);
    });
  }

  validatePorts() {
    const conflicts = this.checkPortConflicts();

    if (conflicts.length === 0) {
      console.log("✅ No port conflicts detected");
      return true;
    }

    console.log("❌ Port conflicts detected:");
    conflicts.forEach(({ port, conflict }) => {
      console.log(`  Port ${port}:`);
      conflict.forEach(({ service, type, category }) => {
        console.log(`    - ${service} (${type}) [${category}]`);
      });
    });
    return false;
  }
}

// CLI Interface
const [, , command, serviceName] = process.argv;

const portManager = new PortManager();

switch (command) {
  case "show":
  case "list":
    portManager.showPortMap();
    break;

  case "get":
    if (!serviceName) {
      console.error("❌ Please specify a service name");
      process.exit(1);
    }
    const serviceConfig = portManager.getServicePort(serviceName);
    if (serviceConfig) {
      console.log(`📡 ${serviceName}:`, JSON.stringify(serviceConfig, null, 2));
    } else {
      console.error(`❌ Service '${serviceName}' not found`);
    }
    break;

  case "validate":
    portManager.validatePorts();
    break;

  case "docker":
    if (!serviceName) {
      console.error("❌ Please specify a service name");
      process.exit(1);
    }
    const dockerConfig = portManager.generateDockerCompose(serviceName);
    if (dockerConfig) {
      console.log(
        `🐳 Docker ports for ${serviceName}:`,
        JSON.stringify(dockerConfig, null, 2)
      );
    }
    break;

  case "help":
  default:
    console.log("🚀 MSDP Port Manager");
    console.log("===================");
    console.log("");
    console.log("Commands:");
    console.log("  show               - Show all port allocations");
    console.log("  get [service]      - Get ports for specific service");
    console.log("  validate           - Check for port conflicts");
    console.log("  docker [service]   - Generate Docker port config");
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/port-manager.js show");
    console.log("  node scripts/port-manager.js get location-service");
    console.log("  node scripts/port-manager.js validate");
    console.log("  node scripts/port-manager.js docker api-gateway");
    break;
}
