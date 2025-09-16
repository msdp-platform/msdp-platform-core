const pool = require("../config/database");

class Payment {
  // ✅ Create Transaction
  static async createTransaction(transactionData) {
    try {
      const {
        orderId,
        userId,
        transactionType,
        providerTransactionId,
        status,
        amount,
        currency,
        countryCode,
        fees,
        details,
      } = transactionData;

      const result = await pool.query(
        `INSERT INTO transactions (order_id, user_id, transaction_type, provider_transaction_id, status, amount, currency, country_code, fees, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          orderId,
          userId,
          transactionType,
          providerTransactionId,
          status,
          amount,
          currency,
          countryCode,
          fees,
          JSON.stringify(details),
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  // ✅ Get Transaction by ID
  static async getTransactionById(transactionId) {
    try {
      const result = await pool.query(
        "SELECT * FROM transactions WHERE id = $1",
        [transactionId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  }

  // ✅ Get User Payment Methods
  static async getUserPaymentMethods(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  }

  // ✅ Add Payment Method
  static async addPaymentMethod(methodData) {
    try {
      const {
        userId,
        methodType,
        provider,
        token,
        lastFour,
        cardBrand,
        billingAddress,
        isDefault = false,
      } = methodData;

      // If this is set as default, update others to not be default
      if (isDefault) {
        await pool.query(
          "UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1",
          [userId]
        );
      }

      const result = await pool.query(
        `INSERT INTO payment_methods (user_id, method_type, provider, token, last_four, card_brand, billing_address, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          userId,
          methodType,
          provider || "loopback",
          token,
          lastFour,
          cardBrand,
          JSON.stringify(billingAddress),
          isDefault,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error adding payment method:", error);
      throw error;
    }
  }

  // ✅ Process Payment (Legacy method for compatibility)
  static async processPayment(paymentData) {
    try {
      const { orderId, userId, paymentMethodId, amount, currency, status } =
        paymentData;

      return await this.createTransaction({
        orderId,
        userId,
        transactionType: "payment",
        providerTransactionId: `legacy_${Date.now()}`,
        status,
        amount,
        currency,
        countryCode: "US",
        fees: "0.00",
        details: { paymentMethodId },
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  }

  // ✅ Get Transactions by Order ID
  static async getTransactionsByOrderId(orderId) {
    try {
      const result = await pool.query(
        "SELECT * FROM transactions WHERE order_id = $1 ORDER BY created_at DESC",
        [orderId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching transactions for order:", error);
      throw error;
    }
  }

  // ✅ Update Transaction Status
  static async updateTransactionStatus(transactionId, status) {
    try {
      const result = await pool.query(
        "UPDATE transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, transactionId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }

  // ✅ Begin Transaction (for database transactions)
  static async beginTransaction() {
    const client = await pool.connect();
    await client.query("BEGIN");
    return client;
  }
}

module.exports = Payment;
