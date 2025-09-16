const axios = require("axios");
const Order = require("../models/Order");

class OrderPaymentCoordinator {
  constructor() {
    this.paymentServiceUrl =
      process.env.PAYMENT_SERVICE_URL || "http://localhost:3007";
  }

  async createOrderWithPayment(cartData, paymentMethodData, userId) {
    console.log(`🛒 Creating order with payment for user: ${userId}`);

    // Start database transaction for atomicity
    const transaction = await Order.beginTransaction();

    try {
      // 1. Create order in 'pending' status
      const orderData = {
        userId,
        merchantId: cartData.merchantId,
        cartId: cartData.cartId,
        deliveryAddress: cartData.deliveryAddress,
        customerName: cartData.customerName,
        customerEmail: cartData.customerEmail,
        merchantName: cartData.merchantName,
        countryCode: cartData.countryCode,
        currencyCode:
          cartData.currencyCode ||
          this.getDefaultCurrency(cartData.countryCode),
        status: "pending",
        subtotal: cartData.subtotal,
        taxAmount: cartData.taxAmount || 0,
        deliveryFee: cartData.deliveryFee || 0,
        discountAmount: cartData.discountAmount || 0,
        notes: cartData.notes,
      };

      // Calculate total
      orderData.totalAmount = this.calculateOrderTotal(orderData);

      const order = await Order.createOrder(orderData, transaction);
      console.log(`📦 Order created with ID: ${order.id}`);

      // 2. Add order items
      if (cartData.items && cartData.items.length > 0) {
        await Order.addOrderItems(order.id, cartData.items, transaction);
        console.log(`📝 Added ${cartData.items.length} items to order`);
      }

      // 3. Process payment through Payment Service
      console.log(`💳 Processing payment for order: ${order.id}`);

      const paymentResult = await this.processPaymentWithService(
        order,
        paymentMethodData,
        userId
      );

      if (paymentResult.success) {
        // 4. Update order status to 'confirmed' and add payment info
        await Order.updateOrderStatus(order.id, "confirmed", transaction);
        await Order.updateOrderPayment(
          order.id,
          {
            paymentId: paymentResult.payment.transactionId,
            paymentStatus: "paid",
          },
          transaction
        );

        // 5. Commit transaction
        await transaction.commit();

        console.log(
          `✅ Order ${order.id} confirmed with payment ${paymentResult.payment.transactionId}`
        );

        // 6. Asynchronously notify merchant and customer
        this.notifyMerchant(order.id, "new_order");
        this.notifyCustomer(order.id, "order_confirmed");

        return {
          success: true,
          order: {
            ...order,
            status: "confirmed",
            paymentId: paymentResult.payment.transactionId,
            paymentStatus: "paid",
          },
          payment: paymentResult.payment,
        };
      } else {
        // 5. Payment failed - rollback transaction
        await transaction.rollback();

        console.log(
          `❌ Payment failed for order ${order.id}: ${paymentResult.error?.message}`
        );

        return {
          success: false,
          error: {
            code: "payment_failed",
            message:
              paymentResult.error?.message || "Payment processing failed",
            details: paymentResult.error,
          },
        };
      }
    } catch (error) {
      // Rollback transaction on any error
      await transaction.rollback();

      console.error(`💥 Order creation failed:`, error);

      return {
        success: false,
        error: {
          code: "order_creation_failed",
          message: error.message,
          details: error,
        },
      };
    }
  }

  async processPaymentWithService(order, paymentMethodData, userId) {
    try {
      const paymentRequest = {
        orderId: order.id,
        paymentMethod: paymentMethodData,
        orderData: {
          orderId: order.id,
          userId: userId,
          subtotal: order.subtotal,
          taxAmount: order.tax_amount,
          deliveryFee: order.delivery_fee,
          discountAmount: order.discount_amount,
          totalAmount: order.total_amount,
          currency: order.currency_code,
          countryCode: order.country_code,
        },
      };

      console.log(
        `🔗 Calling Payment Service: ${this.paymentServiceUrl}/api/payments/process`
      );

      const response = await axios.post(
        `${this.paymentServiceUrl}/api/payments/process`,
        paymentRequest,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.generateServiceToken(userId)}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error(`💥 Payment service call failed:`, error);

      if (error.response) {
        // Payment service returned an error
        return {
          success: false,
          error: {
            code: "payment_service_error",
            message: error.response.data?.message || "Payment service error",
            details: error.response.data,
          },
        };
      } else if (error.request) {
        // Payment service unreachable
        return {
          success: false,
          error: {
            code: "payment_service_unreachable",
            message: "Payment service is currently unavailable",
            details: { url: this.paymentServiceUrl },
          },
        };
      } else {
        // Other error
        return {
          success: false,
          error: {
            code: "payment_processing_error",
            message: error.message,
            details: error,
          },
        };
      }
    }
  }

  calculateOrderTotal(orderData) {
    const subtotal = parseFloat(orderData.subtotal || 0);
    const taxAmount = parseFloat(orderData.taxAmount || 0);
    const deliveryFee = parseFloat(orderData.deliveryFee || 0);
    const discountAmount = parseFloat(orderData.discountAmount || 0);

    return (subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2);
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

  generateServiceToken(userId) {
    // For development: simple token
    // TODO: Implement proper JWT service-to-service authentication
    return `service_token_${userId}_${Date.now()}`;
  }

  async notifyMerchant(orderId, action) {
    // TODO: Implement merchant notification
    console.log(`🏪 [TODO] Notify merchant about order ${orderId}: ${action}`);
  }

  async notifyCustomer(orderId, action) {
    // TODO: Implement customer notification
    console.log(`👤 [TODO] Notify customer about order ${orderId}: ${action}`);
  }

  async processRefund(orderId, amount, reason) {
    console.log(`🔄 Processing refund for order: ${orderId}`);

    try {
      // 1. Get order details
      const order = await Order.getOrderById(orderId);

      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.payment_id) {
        throw new Error("No payment found for this order");
      }

      // 2. Call Payment Service for refund
      const refundRequest = {
        transactionId: order.payment_id,
        amount: amount,
        reason: reason || "Order refund",
      };

      const response = await axios.post(
        `${this.paymentServiceUrl}/api/payments/refund`,
        refundRequest,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.generateServiceToken(order.user_id)}`,
          },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        // 3. Update order status
        await Order.updateOrderStatus(orderId, "refunded");
        await Order.updateOrderPayment(orderId, {
          paymentStatus: "refunded",
          refundId: response.data.refund.refundId,
        });

        console.log(`✅ Refund processed for order ${orderId}`);

        return {
          success: true,
          refund: response.data.refund,
        };
      } else {
        return {
          success: false,
          error: response.data.error,
        };
      }
    } catch (error) {
      console.error(`💥 Refund processing failed:`, error);

      return {
        success: false,
        error: {
          code: "refund_processing_error",
          message: error.message,
        },
      };
    }
  }
}

module.exports = OrderPaymentCoordinator;
