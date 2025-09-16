const pool = require('../config/database');

class Payment {
  static async create(paymentData) {
    const {
      order_id,
      user_id,
      amount,
      currency = 'USD',
      payment_method,
      gateway_provider,
      gateway_transaction_id,
      status = 'pending',
      metadata = {}
    } = paymentData;

    const query = `
      INSERT INTO payments (
        order_id, user_id, amount, currency, payment_method,
        gateway_provider, gateway_transaction_id, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      order_id, user_id, amount, currency, payment_method,
      gateway_provider, gateway_transaction_id, status, JSON.stringify(metadata)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async updateStatus(id, status, gatewayData = {}) {
    const query = `
      UPDATE payments 
      SET status = $2, 
          gateway_response = $3,
          processed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, status, JSON.stringify(gatewayData)]);
    return result.rows[0];
  }

  static async findPendingPayments(olderThanMinutes = 30) {
    const query = `
      SELECT * FROM payments 
      WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '${olderThanMinutes} minutes'
      ORDER BY created_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async getPaymentStats(userId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM payments 
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

  static async refund(paymentId, amount = null, reason = '') {
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;
    
    // Create refund record
    const refundQuery = `
      INSERT INTO payment_refunds (
        payment_id, amount, reason, status
      ) VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;
    
    const refundResult = await pool.query(refundQuery, [paymentId, refundAmount, reason]);
    
    // Update payment status if full refund
    if (refundAmount >= payment.amount) {
      await this.updateStatus(paymentId, 'refunded');
    }

    return refundResult.rows[0];
  }
}

module.exports = Payment;