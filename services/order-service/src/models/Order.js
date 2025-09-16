const pool = require("../config/database");

class Order {
  // Transaction methods
  static async beginTransaction() {
    const client = await pool.connect();
    await client.query("BEGIN");
    return client;
  }

  static async commitTransaction(client) {
    await client.query("COMMIT");
    client.release();
  }

  static async rollbackTransaction(client) {
    await client.query("ROLLBACK");
    client.release();
  }
  static async create(orderData, client = null) {
    const {
      userId,
      merchantId,
      cartId,
      subtotal,
      taxAmount = 0,
      deliveryFee = 0,
      serviceFee = 0,
      tipAmount = 0,
      discountAmount = 0,
      totalAmount,
      deliveryAddress,
      customerName,
      customerEmail,
      merchantName,
      countryCode,
      currencyCode = "USD",
      status = "pending",
    } = orderData;

    // Generate order number (max 20 chars)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const orderNumber = `ORD${timestamp}${random}`; // ORD + 8 digits + 4 chars = 15 chars max

    const query = `
      INSERT INTO orders (
        order_number, user_id, merchant_id, cart_id, status, payment_status,
        subtotal, tax_amount, delivery_fee, service_fee, tip_amount,
        discount_amount, total_amount, delivery_address, customer_name,
        customer_email, merchant_name, country_code, currency_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;

    const values = [
      orderNumber,
      userId,
      merchantId,
      cartId,
      status,
      "pending",
      subtotal,
      taxAmount,
      deliveryFee,
      serviceFee,
      tipAmount,
      discountAmount,
      totalAmount,
      JSON.stringify(deliveryAddress),
      customerName,
      customerEmail,
      merchantName,
      countryCode,
      currencyCode,
    ];

    const db = client || pool;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Alternative method name for createOrderWithPayment compatibility
  static async createOrder(orderData, client = null) {
    return this.create(orderData, client);
  }

  static async addOrderItems(orderId, items, client = null) {
    if (!items || items.length === 0) return true;

    const db = client || pool;

    for (const item of items) {
      const query = `
        INSERT INTO order_items (
          order_id, menu_item_id, item_name, quantity, 
          unit_price, total_price, special_instructions, customizations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const values = [
        orderId,
        item.productId ||
          item.menu_item_id ||
          `item_${Math.random().toString(36).substr(2, 8)}`,
        item.name || item.item_name,
        item.quantity || 1,
        item.price || item.unit_price,
        (item.quantity || 1) * (item.price || item.unit_price),
        item.special_instructions || "",
        JSON.stringify(item.customizations || {}),
      ];

      await db.query(query, values);
    }

    return true;
  }

  static async updateOrderPayment(orderId, paymentData, client = null) {
    const query = `
      UPDATE orders 
      SET payment_status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [orderId, paymentData.payment_status || "paid"];

    const db = client || pool;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async getOrderById(orderId) {
    return this.findById(orderId);
  }

  static async getOrderItems(orderId) {
    const query = "SELECT * FROM order_items WHERE order_id = $1";
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async getOrderTracking(orderId) {
    // For now, return empty array as we haven't implemented tracking table
    // In production, this would query an order_tracking table
    return [];
  }

  static async addOrderTracking(orderId, status, notes = "") {
    // For now, just log the tracking event
    // In production, this would insert into an order_tracking table
    console.log(`📋 Order ${orderId} tracking: ${status} - ${notes}`);
    return true;
  }

  static async getUserOrders(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM orders WHERE user_id = $1";
    const values = [userId];

    if (status) {
      query += " AND status = $2";
      values.push(status);
    }

    query +=
      " ORDER BY created_at DESC LIMIT $" +
      (values.length + 1) +
      " OFFSET $" +
      (values.length + 2);
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const orders = result.rows.map((order) => ({
      ...order,
      delivery_address:
        typeof order.delivery_address === "string"
          ? JSON.parse(order.delivery_address || "{}")
          : order.delivery_address || {},
    }));

    return {
      orders,
      pagination: {
        page,
        limit,
        total: orders.length, // In production, you'd do a separate COUNT query
      },
    };
  }

  static async findById(id) {
    const query = "SELECT * FROM orders WHERE id = $1";
    const result = await pool.query(query, [id]);
    const order = result.rows[0];

    if (order) {
      // Parse JSON fields
      order.items = JSON.parse(order.items || "[]");
      order.shipping_address = JSON.parse(order.shipping_address || "{}");
      order.billing_address = JSON.parse(order.billing_address || "{}");
    }

    return order;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);

    // Parse JSON fields for each order
    return result.rows.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
      shipping_address: JSON.parse(order.shipping_address || "{}"),
      billing_address: JSON.parse(order.billing_address || "{}"),
    }));
  }

  static async updateStatus(id, status, statusReason = null, client = null) {
    const query = `
      UPDATE orders 
      SET status = $2, 
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const db = client || pool;
    const result = await db.query(query, [id, status]);
    const order = result.rows[0];

    if (order) {
      order.items = JSON.parse(order.items || "[]");
      order.shipping_address = JSON.parse(order.shipping_address || "{}");
      order.billing_address = JSON.parse(order.billing_address || "{}");
    }

    return order;
  }

  // Alternative method name for compatibility
  static async updateOrderStatus(id, status, client = null) {
    return this.updateStatus(id, status, null, client);
  }

  static async addTrackingInfo(id, trackingNumber, carrier) {
    const query = `
      UPDATE orders 
      SET tracking_number = $2,
          shipping_carrier = $3,
          status = CASE WHEN status = 'confirmed' THEN 'shipped' ELSE status END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id, trackingNumber, carrier]);
    const order = result.rows[0];

    if (order) {
      order.items = JSON.parse(order.items || "[]");
      order.shipping_address = JSON.parse(order.shipping_address || "{}");
      order.billing_address = JSON.parse(order.billing_address || "{}");
    }

    return order;
  }

  static async findByStatus(status, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM orders 
      WHERE status = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [status, limit, offset]);

    return result.rows.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
      shipping_address: JSON.parse(order.shipping_address || "{}"),
      billing_address: JSON.parse(order.billing_address || "{}"),
    }));
  }

  static async getOrderStats(userId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value
      FROM orders 
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      values.push(userId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      values.push(endDate);
    }

    query += " GROUP BY status ORDER BY status";

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async cancel(id, reason = "Customer requested") {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    return await this.updateStatus(id, "cancelled", reason);
  }

  static async getRecentOrders(limit = 10) {
    const query = `
      SELECT * FROM orders 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);

    return result.rows.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
      shipping_address: JSON.parse(order.shipping_address || "{}"),
      billing_address: JSON.parse(order.billing_address || "{}"),
    }));
  }

  static async searchOrders(searchTerm, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM orders 
      WHERE 
        id::text ILIKE $1 OR
        tracking_number ILIKE $1 OR
        notes ILIKE $1 OR
        items::text ILIKE $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const searchPattern = `%${searchTerm}%`;
    const result = await pool.query(query, [searchPattern, limit, offset]);

    return result.rows.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
      shipping_address: JSON.parse(order.shipping_address || "{}"),
      billing_address: JSON.parse(order.billing_address || "{}"),
    }));
  }
}

module.exports = Order;
