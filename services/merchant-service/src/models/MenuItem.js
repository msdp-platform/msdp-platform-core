const pool = require("../config/database");

class MenuItem {
  static async create(menuItemData) {
    const {
      merchant_id,
      name,
      description,
      price,
      category,
      status = "active",
      stock = 0,
      preparation_time,
      is_vegetarian = false,
      is_vegan = false,
      is_gluten_free = false,
      calories,
      serving_size,
      ingredients = [],
      allergens = [],
      tags = [],
      image_url,
    } = menuItemData;

    const query = `
      INSERT INTO menu_items (
        merchant_id, name, description, price, category, status, stock,
        preparation_time, is_vegetarian, is_vegan, is_gluten_free,
        calories, serving_size, ingredients, allergens, tags, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      merchant_id,
      name,
      description,
      price,
      category,
      status,
      stock,
      preparation_time,
      is_vegetarian,
      is_vegan,
      is_gluten_free,
      calories,
      serving_size,
      JSON.stringify(ingredients),
      JSON.stringify(allergens),
      JSON.stringify(tags),
      image_url,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll(merchantId, filters = {}) {
    let query = "SELECT * FROM menu_items WHERE merchant_id = $1";
    const values = [merchantId];
    let paramCount = 1;

    if (filters.category && filters.category !== "all") {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
    }

    if (filters.status && filters.status !== "all") {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id, merchantId) {
    const query = "SELECT * FROM menu_items WHERE id = $1 AND merchant_id = $2";
    const result = await pool.query(query, [id, merchantId]);
    return result.rows[0];
  }

  static async update(id, merchantId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);

        // Handle JSON fields
        if (["ingredients", "allergens", "tags"].includes(key)) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    paramCount++;
    fields.push(`updated_at = NOW()`);
    values.push(id, merchantId);

    const query = `
      UPDATE menu_items 
      SET ${fields.join(", ")} 
      WHERE id = $${paramCount} AND merchant_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id, merchantId) {
    const query =
      "DELETE FROM menu_items WHERE id = $1 AND merchant_id = $2 RETURNING *";
    const result = await pool.query(query, [id, merchantId]);
    return result.rows[0];
  }

  static async getStats(merchantId) {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'out_of_stock' THEN 1 END) as out_of_stock_products,
        AVG(price) as average_price,
        SUM(CASE WHEN status = 'active' THEN stock ELSE 0 END) as total_stock
      FROM menu_items 
      WHERE merchant_id = $1
    `;

    const result = await pool.query(query, [merchantId]);
    return result.rows[0];
  }
}

module.exports = MenuItem;
