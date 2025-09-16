const pool = require("../config/database");

class Order {
  // ✅ Create Order
  static async createOrder(orderData, transaction = null) {
    const client = transaction || pool;

    try {
      const {
        userId,
        merchantId,
        cartId,
        deliveryAddress,
        customerName,
        customerEmail,
        merchantName,
        countryCode,
        currencyCode,
        status,
        subtotal,
        taxAmount,
        deliveryFee,
        discountAmount,
        totalAmount,
        notes,
      } = orderData;

      const result = await client.query(
        `INSERT INTO orders (
          user_id, merchant_id, cart_id, delivery_address, customer_name, customer_email, 
          merchant_name, country_code, currency_code, status, subtotal, tax_amount, 
          delivery_fee, discount_amount, total_amount, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
        RETURNING *`,
        [
          userId,
          merchantId,
          cartId,
          JSON.stringify(deliveryAddress),
          customerName,
          customerEmail,
          merchantName,
          countryCode,
          currencyCode,
          status,
          subtotal,
          taxAmount,
          deliveryFee,
          discountAmount,
          totalAmount,
          notes,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // ✅ Add Order Items
  static async addOrderItems(orderId, items, transaction = null) {
    const client = transaction || pool;

    try {
      const queries = items.map((item) => {
        return client.query(
          `INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, total_price, special_instructions, customizations)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            orderId,
            item.menuItemId,
            item.itemName,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            item.specialInstructions,
            JSON.stringify(item.customizations || {}),
          ]
        );
      });

      const results = await Promise.all(queries);
      return results.map((result) => result.rows[0]);
    } catch (error) {
      console.error("Error adding order items:", error);
      throw error;
    }
  }

  // ✅ Get Order by ID
  static async getOrderById(orderId) {
    try {
      const result = await pool.query("SELECT * FROM orders WHERE id = $1", [
        orderId,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }

  // ✅ Get Order Items
  static async getOrderItems(orderId) {
    try {
      const result = await pool.query(
        "SELECT * FROM order_items WHERE order_id = $1 ORDER BY added_at ASC",
        [orderId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching order items:", error);
      throw error;
    }
  }

  // ✅ Get Order Tracking
  static async getOrderTracking(orderId) {
    try {
      const result = await pool.query(
        "SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY timestamp DESC",
        [orderId]
      );

      return result.rows;
    } catch (error) {
      console.error("Error fetching order tracking:", error);
      throw error;
    }
  }

  // ✅ Get User Orders
  static async getUserOrders(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;

      let query = "SELECT * FROM orders WHERE user_id = $1";
      let params = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = "SELECT COUNT(*) FROM orders WHERE user_id = $1";
      let countParams = [userId];

      if (status) {
        countQuery += " AND status = $2";
        countParams.push(status);
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalCount = parseInt(countResult.rows[0].count);

      return {
        orders: result.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  }

  // ✅ Update Order Status
  static async updateOrderStatus(
    orderId,
    status,
    notes = null,
    transaction = null
  ) {
    const client = transaction || pool;

    try {
      const result = await client.query(
        "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, orderId]
      );

      // Add to status history
      if (result.rows[0]) {
        await client.query(
          "INSERT INTO order_status_history (order_id, status, changed_by, timestamp) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
          [orderId, status, "system"]
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // ✅ Update Order Payment
  static async updateOrderPayment(orderId, paymentData, transaction = null) {
    const client = transaction || pool;

    try {
      const { paymentId, paymentStatus, refundId } = paymentData;

      const result = await client.query(
        `UPDATE orders SET 
         payment_id = COALESCE($1, payment_id), 
         payment_status = COALESCE($2, payment_status),
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 RETURNING *`,
        [paymentId, paymentStatus, orderId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error updating order payment:", error);
      throw error;
    }
  }

  // ✅ Add Order Tracking
  static async addOrderTracking(
    orderId,
    status,
    notes = null,
    location = null
  ) {
    try {
      const result = await pool.query(
        "INSERT INTO order_tracking (order_id, status, location, notes) VALUES ($1, $2, $3, $4) RETURNING *",
        [orderId, status, JSON.stringify(location), notes]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error adding order tracking:", error);
      throw error;
    }
  }

  // ✅ Begin Transaction (for database transactions)
  static async beginTransaction() {
    const client = await pool.connect();
    await client.query("BEGIN");

    // Add commit and rollback methods to the client
    client.commit = async () => {
      try {
        await client.query("COMMIT");
      } finally {
        client.release();
      }
    };

    client.rollback = async () => {
      try {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    };

    return client;
  }
}

module.exports = Order;
