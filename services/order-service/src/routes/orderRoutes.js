const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const Order = require("../models/Order");
const OrderPaymentCoordinator = require("../services/orderPaymentCoordinator");

const router = express.Router();
const orderPaymentCoordinator = new OrderPaymentCoordinator();

// ✅ All order routes require user authentication
router.use(authenticateUser);

// ✅ Create Order with Payment (Essential for customer experience)
router.post("/create", async (req, res, next) => {
  try {
    const { cartData, paymentMethod } = req.body;

    // Validate required fields
    if (!cartData || !paymentMethod) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["cartData", "paymentMethod"],
        received: { cartData: !!cartData, paymentMethod: !!paymentMethod },
      });
    }

    // Validate cart data
    if (
      !cartData.merchantId ||
      !cartData.items ||
      cartData.items.length === 0
    ) {
      return res.status(400).json({
        error: "Invalid cart data",
        required: ["merchantId", "items (non-empty array)"],
      });
    }

    console.log(
      `🛒 Creating order for user ${req.user.userId} with ${cartData.items.length} items`
    );

    // Create order with payment coordination
    const result = await orderPaymentCoordinator.createOrderWithPayment(
      cartData,
      paymentMethod,
      req.user.userId
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        order: result.order,
        payment: result.payment,
        message: "Order created and payment processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        message: "Order creation failed",
      });
    }
  } catch (error) {
    console.error("💥 Order creation error:", error);
    next(error);
  }
});

// ✅ Get User Orders (Essential for customer experience)
router.get("/user/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Ensure user can only access their own orders
    if (userId !== req.user.userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own orders",
      });
    }

    const orders = await Order.getUserOrders(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status,
    });

    res.status(200).json({
      success: true,
      orders: orders.orders,
      pagination: orders.pagination,
      message: "Orders retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    next(error);
  }
});

// ✅ Get Order Details (Essential for customer experience)
router.get("/:orderId", async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: "Order ID is required",
      });
    }

    const order = await Order.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
        orderId: orderId,
      });
    }

    // Ensure user can only access their own orders
    if (order.user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only access your own orders",
      });
    }

    // Get order items
    const orderItems = await Order.getOrderItems(orderId);

    // Get order tracking
    const trackingHistory = await Order.getOrderTracking(orderId);

    res.status(200).json({
      success: true,
      order: {
        ...order,
        items: orderItems,
        tracking: trackingHistory,
      },
      message: "Order retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    next(error);
  }
});

// Update order status (for merchant/admin use)
router.put("/:orderId/status", async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["orderId", "status"],
      });
    }

    // TODO: Add authorization check for merchant/admin
    // For now, allow any authenticated user (should be restricted)

    const result = await Order.updateOrderStatus(orderId, status, notes);

    if (result) {
      // Add to tracking history
      await Order.addOrderTracking(orderId, status, notes);

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        orderId: orderId,
        status: status,
      });
    } else {
      res.status(404).json({
        error: "Order not found or update failed",
        orderId: orderId,
      });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    next(error);
  }
});

// Cancel order
router.post("/:orderId/cancel", async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: "Order ID is required",
      });
    }

    const order = await Order.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Ensure user can only cancel their own orders
    if (order.user_id !== req.user.userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only cancel your own orders",
      });
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed", "preparing"].includes(order.status)) {
      return res.status(400).json({
        error: "Order cannot be cancelled",
        message: `Orders with status '${order.status}' cannot be cancelled`,
        currentStatus: order.status,
      });
    }

    console.log(`❌ Cancelling order ${orderId} for user ${req.user.userId}`);

    // Update order status to cancelled
    await Order.updateOrderStatus(orderId, "cancelled");
    await Order.addOrderTracking(
      orderId,
      "cancelled",
      reason || "Cancelled by customer"
    );

    // Process refund if payment was made
    if (order.payment_status === "paid" && order.payment_id) {
      console.log(`💰 Processing refund for cancelled order ${orderId}`);

      const refundResult = await orderPaymentCoordinator.processRefund(
        orderId,
        order.total_amount,
        reason || "Order cancelled by customer"
      );

      if (refundResult.success) {
        res.status(200).json({
          success: true,
          message: "Order cancelled and refund processed",
          orderId: orderId,
          refund: refundResult.refund,
        });
      } else {
        res.status(200).json({
          success: true,
          message: "Order cancelled, but refund processing failed",
          orderId: orderId,
          refundError: refundResult.error,
          note: "Please contact support for refund assistance",
        });
      }
    } else {
      res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        orderId: orderId,
      });
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    next(error);
  }
});

module.exports = router;
