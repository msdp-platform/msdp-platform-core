const { PaymentGatewayFactory, GATEWAY_CONFIG } = require("../config/gateways");
const Payment = require("../models/Payment");

class PaymentProcessor {
  constructor() {
    this.environment = process.env.NODE_ENV || "development";
    this.defaultGateway = this.getDefaultGateway();
  }

  getDefaultGateway() {
    const config = GATEWAY_CONFIG[this.environment];
    return config ? config.default : "loopback";
  }

  selectGateway(countryCode, paymentMethodType) {
    const config = GATEWAY_CONFIG[this.environment];

    if (!config || !config[countryCode]) {
      console.log(`🌍 Using default gateway for country: ${countryCode}`);
      return this.defaultGateway;
    }

    const countryConfig = config[countryCode];

    // For development, always use loopback
    if (this.environment === "development") {
      return "loopback";
    }

    // TODO: Add payment method specific logic
    // e.g., UPI in India should use Razorpay
    if (countryCode === "IN" && paymentMethodType === "upi") {
      return "razorpay";
    }

    return countryConfig.primary || this.defaultGateway;
  }

  async processPayment(orderData, paymentMethodData) {
    console.log(`💳 Processing payment for order: ${orderData.orderId}`);

    try {
      // 1. Validate input data
      this.validatePaymentData(orderData, paymentMethodData);

      // 2. Select appropriate gateway
      const gatewayName = this.selectGateway(
        orderData.countryCode,
        paymentMethodData.type
      );
      const gateway = PaymentGatewayFactory.createGateway(gatewayName);

      console.log(
        `🎆 Selected gateway: ${gatewayName} for ${orderData.countryCode}`
      );

      // 3. Calculate total with fees and taxes
      const paymentTotal = await this.calculatePaymentTotal(orderData);

      // 4. Process payment with gateway
      const gatewayResult = await gateway.processPayment(
        paymentTotal,
        paymentMethodData
      );

      // 5. Record transaction in database
      const transaction = await this.recordTransaction(
        orderData,
        paymentMethodData,
        gatewayResult
      );

      // 6. Return standardized response
      return {
        success: gatewayResult.success,
        transactionId: transaction.id,
        gatewayTransactionId: gatewayResult.transactionId,
        amount: paymentTotal.totalAmount,
        currency: paymentTotal.currency,
        status: gatewayResult.success ? "completed" : "failed",
        paymentMethod: {
          type: paymentMethodData.type,
          lastFour: paymentMethodData.lastFour,
          brand: paymentMethodData.brand,
        },
        processedAt: gatewayResult.processedAt,
        error: gatewayResult.error || null,
        gateway: gatewayName,
      };
    } catch (error) {
      console.error(`❌ Payment processing failed:`, error);

      // Record failed transaction
      await this.recordFailedTransaction(orderData, paymentMethodData, error);

      return {
        success: false,
        error: {
          code: "processing_error",
          message: error.message,
          type: "system_error",
        },
        processedAt: new Date().toISOString(),
      };
    }
  }

  async calculatePaymentTotal(orderData) {
    console.log(`🧮 Calculating payment total for order: ${orderData.orderId}`);

    const subtotal = parseFloat(orderData.subtotal || 0);
    const taxAmount = parseFloat(orderData.taxAmount || 0);
    const deliveryFee = parseFloat(orderData.deliveryFee || 0);
    const discountAmount = parseFloat(orderData.discountAmount || 0);

    // Calculate additional fees (payment processing)
    const processingFee = this.calculateProcessingFee(
      subtotal,
      orderData.countryCode
    );

    const totalAmount =
      subtotal + taxAmount + deliveryFee + processingFee - discountAmount;

    return {
      orderId: orderData.orderId,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      processingFee: processingFee.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      currency:
        orderData.currency || this.getDefaultCurrency(orderData.countryCode),
      countryCode: orderData.countryCode,
    };
  }

  calculateProcessingFee(amount, countryCode) {
    // Different fee structures by country
    const feeStructures = {
      US: { percentage: 0.029, fixed: 0.3 },
      IN: { percentage: 0.02, fixed: 0.0 },
      GB: { percentage: 0.025, fixed: 0.2 },
      SG: { percentage: 0.028, fixed: 0.5 },
    };

    const structure = feeStructures[countryCode] || feeStructures.US;
    return amount * structure.percentage + structure.fixed;
  }

  getDefaultCurrency(countryCode) {
    const currencies = {
      US: "USD",
      IN: "INR",
      GB: "GBP",
      SG: "SGD",
    };

    return currencies[countryCode] || "USD";
  }

  validatePaymentData(orderData, paymentMethodData) {
    if (!orderData.orderId) {
      throw new Error("Order ID is required");
    }

    if (!orderData.subtotal || parseFloat(orderData.subtotal) <= 0) {
      throw new Error("Valid subtotal is required");
    }

    if (!paymentMethodData.type) {
      throw new Error("Payment method type is required");
    }

    if (!orderData.countryCode) {
      throw new Error("Country code is required");
    }
  }

  async recordTransaction(orderData, paymentMethodData, gatewayResult) {
    const transactionData = {
      orderId: orderData.orderId,
      userId: orderData.userId,
      transactionType: "payment",
      providerTransactionId: gatewayResult.transactionId,
      status: gatewayResult.success ? "completed" : "failed",
      amount: gatewayResult.amount,
      currency: gatewayResult.currency,
      countryCode: orderData.countryCode,
      fees: gatewayResult.fees || "0.00",
      details: {
        gateway: gatewayResult.gatewayResponse?.gateway || "unknown",
        paymentMethod: {
          type: paymentMethodData.type,
          lastFour: paymentMethodData.lastFour,
          brand: paymentMethodData.brand,
        },
        gatewayResponse: gatewayResult.gatewayResponse,
      },
    };

    return await Payment.createTransaction(transactionData);
  }

  async recordFailedTransaction(orderData, paymentMethodData, error) {
    const transactionData = {
      orderId: orderData.orderId,
      userId: orderData.userId,
      transactionType: "payment",
      status: "failed",
      amount: orderData.subtotal || "0.00",
      currency: orderData.currency || "USD",
      countryCode: orderData.countryCode,
      fees: "0.00",
      details: {
        error: {
          code: "processing_error",
          message: error.message,
        },
        paymentMethod: {
          type: paymentMethodData.type,
          lastFour: paymentMethodData.lastFour,
          brand: paymentMethodData.brand,
        },
      },
    };

    try {
      return await Payment.createTransaction(transactionData);
    } catch (dbError) {
      console.error("Failed to record failed transaction:", dbError);
      return null;
    }
  }

  async processRefund(transactionId, amount, reason) {
    console.log(`🔄 Processing refund for transaction: ${transactionId}`);

    try {
      // 1. Get original transaction
      const originalTransaction =
        await Payment.getTransactionById(transactionId);

      if (!originalTransaction) {
        throw new Error("Original transaction not found");
      }

      // 2. Validate refund amount
      if (amount > parseFloat(originalTransaction.amount)) {
        throw new Error(
          "Refund amount cannot exceed original transaction amount"
        );
      }

      // 3. Get gateway and process refund
      const gatewayName =
        originalTransaction.details?.gateway || this.defaultGateway;
      const gateway = PaymentGatewayFactory.createGateway(gatewayName);

      const refundResult = await gateway.refundPayment(
        originalTransaction.provider_transaction_id,
        amount,
        reason
      );

      // 4. Record refund transaction
      const refundTransaction = await this.recordRefundTransaction(
        originalTransaction,
        refundResult,
        reason
      );

      return {
        success: refundResult.success,
        refundId: refundTransaction.id,
        amount: amount,
        status: refundResult.status,
        processedAt: refundResult.processedAt,
      };
    } catch (error) {
      console.error(`❌ Refund processing failed:`, error);

      return {
        success: false,
        error: {
          code: "refund_error",
          message: error.message,
        },
      };
    }
  }

  async recordRefundTransaction(originalTransaction, refundResult, reason) {
    const refundData = {
      orderId: originalTransaction.order_id,
      userId: originalTransaction.user_id,
      transactionType: "refund",
      providerTransactionId: refundResult.refundId,
      status: refundResult.success ? "completed" : "failed",
      amount: refundResult.amount,
      currency: originalTransaction.currency,
      countryCode: originalTransaction.country_code,
      fees: "0.00",
      details: {
        originalTransactionId: originalTransaction.id,
        reason: reason,
        refundResult: refundResult,
      },
    };

    return await Payment.createTransaction(refundData);
  }
}

module.exports = PaymentProcessor;
