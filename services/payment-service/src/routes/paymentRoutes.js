const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const Payment = require("../models/Payment");
const PaymentProcessor = require("../services/paymentProcessor");

const router = express.Router();
const paymentProcessor = new PaymentProcessor();

// ✅ Service-to-Service Payment Processing (for Order Service)
router.post("/process-internal", async (req, res, next) => {
  try {
    const { orderId, paymentMethod, orderData } = req.body;

    // Validate required fields
    if (!orderId || !paymentMethod || !orderData) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["orderId", "paymentMethod", "orderData"],
        received: {
          orderId: !!orderId,
          paymentMethod: !!paymentMethod,
          orderData: !!orderData,
        },
      });
    }

    console.log(
      `💳 Processing internal payment for order ${orderId}`
    );

    // Process payment through payment processor
    const paymentResult = await paymentProcessor.processPayment(
      orderData,
      paymentMethod
    );

    if (paymentResult.success) {
      res.status(200).json({
        success: true,
        payment: {
          transactionId: paymentResult.transactionId,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          status: paymentResult.status,
          gateway_provider: paymentResult.gateway_provider,
          gateway_transaction_id: paymentResult.gateway_transaction_id,
          processed_at: paymentResult.processed_at,
        },
        message: "Payment processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResult.error,
        message: "Payment processing failed",
      });
    }
  } catch (error) {
    console.error("💥 Internal payment processing error:", error);
    next(error);
  }
});

// ✅ Process Payment (Essential for customer experience)
router.post("/process", authenticateUser, async (req, res, next) => {
  try {
    const { orderId, paymentMethod, orderData } = req.body;

    // Validate required fields
    if (!orderId || !paymentMethod || !orderData) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["orderId", "paymentMethod", "orderData"],
        received: {
          orderId: !!orderId,
          paymentMethod: !!paymentMethod,
          orderData: !!orderData,
        },
      });
    }

    // Ensure user context
    const enrichedOrderData = {
      ...orderData,
      orderId,
      userId: req.user.id,
    };

    console.log(
      `💳 Processing payment for order ${orderId} by user ${req.user.id}`
    );

    // Process payment through payment processor
    const paymentResult = await paymentProcessor.processPayment(
      enrichedOrderData,
      paymentMethod
    );

    if (paymentResult.success) {
      res.status(200).json({
        success: true,
        payment: {
          transactionId: paymentResult.transactionId,
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          status: paymentResult.status,
          paymentMethod: paymentResult.paymentMethod,
          processedAt: paymentResult.processedAt,
        },
        message: "Payment processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResult.error,
        message: "Payment processing failed",
      });
    }
  } catch (error) {
    console.error("💥 Payment processing error:", error);
    next(error);
  }
});

// ✅ Calculate Order Total (Essential for customer experience)
router.post("/calculate-total", async (req, res, next) => {
  try {
    const orderData = req.body;

    if (!orderData.subtotal || !orderData.countryCode) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["subtotal", "countryCode"],
      });
    }

    const paymentTotal =
      await paymentProcessor.calculatePaymentTotal(orderData);

    res.status(200).json({
      success: true,
      total: paymentTotal,
      message: "Payment total calculated successfully",
    });
  } catch (error) {
    console.error("Error calculating payment total:", error);
    next(error);
  }
});

// Get payment methods for user
router.get("/methods", authenticateUser, async (req, res, next) => {
  try {
    const paymentMethods = await Payment.getUserPaymentMethods(req.user.id);

    res.status(200).json({
      success: true,
      paymentMethods,
      message: "Payment methods retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    next(error);
  }
});

// Add new payment method
router.post("/methods", authenticateUser, async (req, res, next) => {
  try {
    const { type, token, lastFour, brand, billingAddress } = req.body;

    if (!type || !token) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["type", "token"],
      });
    }

    const paymentMethod = await Payment.addPaymentMethod({
      userId: req.user.id,
      methodType: type,
      token,
      lastFour,
      cardBrand: brand,
      billingAddress,
    });

    res.status(201).json({
      success: true,
      paymentMethod,
      message: "Payment method added successfully",
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    next(error);
  }
});

// Process refund
router.post("/refund", authenticateUser, async (req, res, next) => {
  try {
    const { transactionId, amount, reason } = req.body;

    if (!transactionId || !amount) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["transactionId", "amount"],
      });
    }

    console.log(`🔄 Processing refund for transaction ${transactionId}`);

    const refundResult = await paymentProcessor.processRefund(
      transactionId,
      parseFloat(amount),
      reason || "Customer requested refund"
    );

    if (refundResult.success) {
      res.status(200).json({
        success: true,
        refund: {
          refundId: refundResult.refundId,
          amount: refundResult.amount,
          status: refundResult.status,
          processedAt: refundResult.processedAt,
        },
        message: "Refund processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: refundResult.error,
        message: "Refund processing failed",
      });
    }
  } catch (error) {
    console.error("💥 Refund processing error:", error);
    next(error);
  }
});

module.exports = router;
