const pool = require('../config/database');

class Order {
  static async create(orderData) {
    const {
      user_id,
      items,
      total_amount,
      currency = 'USD',
      shipping_address,
      billing_address,
      payment_method,
      notes = '',
      status = 'pending'
    } = orderData;

    const query = `
      INSERT INTO orders (
        user_id, items, total_amount, currency, shipping_address,
        billing_address, payment_method, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      user_id, JSON.stringify(items), total_amount, currency,
      JSON.stringify(shipping_address), JSON.stringify(billing_address),
      payment_method, notes, status
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    const order = result.rows[0];
    
    if (order) {
      // Parse JSON fields
      order.items = JSON.parse(order.items || '[]');
      order.shipping_address = JSON.parse(order.shipping_address || '{}');
      order.billing_address = JSON.parse(order.billing_address || '{}');
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
    return result.rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}'),
      billing_address: JSON.parse(order.billing_address || '{}')
    }));
  }

  static async updateStatus(id, status, statusReason = null) {
    const query = `
      UPDATE orders 
      SET status = $2, 
          status_updated_at = NOW(),
          updated_at = NOW(),
          status_reason = $3
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, status, statusReason]);
    const order = result.rows[0];
    
    if (order) {
      order.items = JSON.parse(order.items || '[]');
      order.shipping_address = JSON.parse(order.shipping_address || '{}');
      order.billing_address = JSON.parse(order.billing_address || '{}');
    }
    
    return order;
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
      order.items = JSON.parse(order.items || '[]');
      order.shipping_address = JSON.parse(order.shipping_address || '{}');
      order.billing_address = JSON.parse(order.billing_address || '{}');
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
    
    return result.rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}'),
      billing_address: JSON.parse(order.billing_address || '{}')
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

    query += ' GROUP BY status ORDER BY status';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async cancel(id, reason = 'Customer requested') {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    return await this.updateStatus(id, 'cancelled', reason);
  }

  static async getRecentOrders(limit = 10) {
    const query = `
      SELECT * FROM orders 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    
    return result.rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}'),
      billing_address: JSON.parse(order.billing_address || '{}')
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
    
    return result.rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shipping_address: JSON.parse(order.shipping_address || '{}'),
      billing_address: JSON.parse(order.billing_address || '{}')
    }));
  }
}

module.exports = Order;