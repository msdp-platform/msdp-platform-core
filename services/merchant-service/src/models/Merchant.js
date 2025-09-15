const pool = require("../config/database");
const bcrypt = require("bcryptjs");

class Merchant {
  static async create(merchantData) {
    const {
      name,
      email,
      password,
      phone,
      address,
      business_type,
      description,
      logo_url,
    } = merchantData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO merchants (
        name, email, password_hash, phone, address, business_type, description, logo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, phone, address, business_type, description, logo_url, created_at
    `;

    const values = [
      name,
      email,
      hashedPassword,
      phone,
      address,
      business_type,
      description,
      logo_url,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM merchants WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, name, email, phone, address, business_type, description, 
             logo_url, created_at, updated_at, status
      FROM merchants WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && key !== "password") {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (updateData.password) {
      paramCount++;
      fields.push(`password_hash = $${paramCount}`);
      values.push(await bcrypt.hash(updateData.password, 10));
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    paramCount++;
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE merchants 
      SET ${fields.join(", ")} 
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone, address, business_type, description, logo_url, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async verifyPassword(email, password) {
    const merchant = await this.findByEmail(email);
    if (!merchant) {
      return null;
    }

    const isValid = await bcrypt.compare(password, merchant.password_hash);
    return isValid ? merchant : null;
  }

  static async getDashboardStats(id) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM menu_items WHERE merchant_id = $1) as total_products,
        (SELECT COUNT(*) FROM menu_items WHERE merchant_id = $1 AND status = 'active') as active_products,
        (SELECT COALESCE(SUM(price * stock), 0) FROM menu_items WHERE merchant_id = $1) as inventory_value,
        (SELECT COUNT(DISTINCT customer_id) FROM orders WHERE merchant_id = $1) as total_customers
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Merchant;
