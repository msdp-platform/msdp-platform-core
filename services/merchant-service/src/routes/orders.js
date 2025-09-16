const express = require("express");
const authMiddleware = require("../middleware/auth");
const axios = require("axios");

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:3006";

// Get orders for merchant
router.get("/", async (req, res) => {
  try {
    const { merchant_id } = req.user;
    const { status, limit = 50, offset = 0 } = req.query;

    // Call Order Service to get orders for this merchant
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/merchant/${merchant_id}`,
      {
        params: { status, limit, offset },
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching merchant orders:", error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || "Failed to fetch orders",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  }
});

// Update order status
router.put("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const { merchant_id } = req.user;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Valid merchant order statuses
    const validStatuses = ["confirmed", "preparing", "ready", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        validStatuses,
      });
    }

    // Call Order Service to update order status
    const response = await axios.put(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}/status`,
      { status, notes },
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: response.data,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message:
          error.response.data?.message || "Failed to update order status",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      });
    }
  }
});

// Get order details
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Call Order Service to get order details
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message:
          error.response.data?.message || "Failed to fetch order details",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch order details",
        error: error.message,
      });
    }
  }
});

// Get merchant analytics/stats
router.get("/analytics/summary", async (req, res) => {
  try {
    const { merchant_id } = req.user;
    const { startDate, endDate } = req.query;

    // Mock analytics data for now - in production this would call analytics service
    const analytics = {
      totalOrders: 156,
      totalRevenue: 12450.0,
      averageOrderValue: 79.81,
      completedOrders: 142,
      pendingOrders: 8,
      cancelledOrders: 6,
      topSellingItems: [
        { name: "California Roll", orders: 45, revenue: 584.55 },
        { name: "Salmon Teriyaki", orders: 32, revenue: 607.68 },
        { name: "Miso Soup", orders: 28, revenue: 139.72 },
      ],
      revenueByDay: [
        { date: "2025-09-10", revenue: 1250.0 },
        { date: "2025-09-11", revenue: 1450.0 },
        { date: "2025-09-12", revenue: 1380.0 },
        { date: "2025-09-13", revenue: 1620.0 },
        { date: "2025-09-14", revenue: 1540.0 },
        { date: "2025-09-15", revenue: 1680.0 },
        { date: "2025-09-16", revenue: 1530.0 },
      ],
    };

    res.json({
      success: true,
      data: analytics,
      period: {
        startDate: startDate || "2025-09-10",
        endDate: endDate || "2025-09-16",
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
});

module.exports = router;
