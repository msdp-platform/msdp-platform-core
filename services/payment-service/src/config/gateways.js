// Payment Gateway Configuration
// Loopback gateway for development, real gateways for production

class LoopbackGateway {
  constructor() {
    this.name = "loopback";
    this.isTestMode = true;
  }

  async processPayment(orderData, paymentMethod) {
    console.log(
      `🔄 [LOOPBACK] Processing payment for order ${orderData.orderId}`
    );

    // Simulate processing delay
    await this.simulateDelay(1000);

    // Simulate different payment scenarios based on amount
    const amount = parseFloat(orderData.totalAmount);

    if (amount <= 0) {
      return this.createFailureResponse(
        "invalid_amount",
        "Amount must be greater than 0"
      );
    }

    if (amount > 1000) {
      return this.createFailureResponse(
        "amount_too_high",
        "Amount exceeds limit for test payments"
      );
    }

    // Simulate card-specific failures
    if (paymentMethod.lastFour === "0002") {
      return this.createFailureResponse("card_declined", "Card was declined");
    }

    if (paymentMethod.lastFour === "0004") {
      return this.createFailureResponse(
        "insufficient_funds",
        "Insufficient funds"
      );
    }

    if (paymentMethod.lastFour === "0009") {
      return this.createFailureResponse(
        "fraud_detected",
        "Transaction flagged for fraud"
      );
    }

    // Default: successful payment
    return this.createSuccessResponse(orderData, paymentMethod);
  }

  async refundPayment(transactionId, amount, reason) {
    console.log(
      `🔄 [LOOPBACK] Processing refund for transaction ${transactionId}`
    );

    await this.simulateDelay(800);

    return {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      status: "completed",
      processedAt: new Date().toISOString(),
    };
  }

  async validatePaymentMethod(paymentMethod) {
    console.log(`🔄 [LOOPBACK] Validating payment method`);

    await this.simulateDelay(300);

    // Always valid for loopback
    return {
      valid: true,
      token: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  createSuccessResponse(orderData, paymentMethod) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: orderData.totalAmount,
      currency: orderData.currency || "USD",
      status: "completed",
      paymentMethod: {
        type: paymentMethod.type,
        lastFour: paymentMethod.lastFour,
        brand: paymentMethod.brand,
      },
      processedAt: new Date().toISOString(),
      fees: this.calculateFees(orderData.totalAmount),
      gatewayResponse: {
        gateway: "loopback",
        message: "Payment processed successfully (TEST MODE)",
      },
    };
  }

  createFailureResponse(errorCode, errorMessage) {
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        type: "payment_error",
      },
      transactionId: `failed_${Date.now()}`,
      processedAt: new Date().toISOString(),
      gatewayResponse: {
        gateway: "loopback",
        message: `Payment failed: ${errorMessage} (TEST MODE)`,
      },
    };
  }

  calculateFees(amount) {
    // Simulate 2.9% + $0.30 fee structure
    const percentage = parseFloat(amount) * 0.029;
    const fixed = 0.3;
    return (percentage + fixed).toFixed(2);
  }

  async simulateDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Future: Real gateway implementations
class StripeGateway {
  constructor(apiKey) {
    this.name = "stripe";
    this.apiKey = apiKey;
    // TODO: Initialize Stripe SDK
  }

  async processPayment(orderData, paymentMethod) {
    // TODO: Implement real Stripe integration
    throw new Error("Stripe gateway not implemented yet");
  }
}

class RazorpayGateway {
  constructor(apiKey, apiSecret) {
    this.name = "razorpay";
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    // TODO: Initialize Razorpay SDK
  }

  async processPayment(orderData, paymentMethod) {
    // TODO: Implement real Razorpay integration
    throw new Error("Razorpay gateway not implemented yet");
  }
}

// Gateway Factory
class PaymentGatewayFactory {
  static createGateway(gatewayName, config = {}) {
    switch (gatewayName.toLowerCase()) {
      case "loopback":
        return new LoopbackGateway();
      case "stripe":
        return new StripeGateway(config.apiKey);
      case "razorpay":
        return new RazorpayGateway(config.apiKey, config.apiSecret);
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayName}`);
    }
  }

  static getAvailableGateways() {
    return {
      development: ["loopback"],
      production: ["stripe", "razorpay", "paypal", "square"],
    };
  }
}

// Country-specific gateway configuration
const GATEWAY_CONFIG = {
  development: {
    default: "loopback",
    US: { primary: "loopback", backup: "loopback" },
    IN: { primary: "loopback", backup: "loopback" },
    GB: { primary: "loopback", backup: "loopback" },
    SG: { primary: "loopback", backup: "loopback" },
  },
  production: {
    default: "stripe",
    US: { primary: "stripe", backup: "square" },
    IN: { primary: "razorpay", backup: "stripe" },
    GB: { primary: "stripe", backup: "worldpay" },
    SG: { primary: "stripe", backup: "adyen" },
  },
};

module.exports = {
  LoopbackGateway,
  StripeGateway,
  RazorpayGateway,
  PaymentGatewayFactory,
  GATEWAY_CONFIG,
};
