const pool = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

class Cart {
  // ✅ Order Service owns cart data
  static async create(userId, merchantId, countryCode = "US") {
    try {
      const cartId = uuidv4();

      const query = `
        INSERT INTO carts (id, user_id, merchant_id, country_code, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING *
      `;

      const result = await pool.query(query, [
        cartId,
        userId,
        merchantId,
        countryCode,
      ]);

      logger.info(`✅ Cart created: ${cartId} for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to create cart:", error.message);
      throw error;
    }
  }

  static async findByUser(userId, merchantId) {
    try {
      const query = `
        SELECT * FROM carts 
        WHERE user_id = $1 AND merchant_id = $2 AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId, merchantId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("❌ Failed to find cart:", error.message);
      throw error;
    }
  }

  static async addItem(cartId, itemData) {
    try {
      const {
        menuItemId,
        itemName,
        quantity,
        unitPrice,
        specialInstructions,
        customizations,
      } = itemData;

      // Check if item already exists in cart
      const existingItem = await pool.query(
        "SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2",
        [cartId, menuItemId]
      );

      let result;
      if (existingItem.rows.length > 0) {
        // Update existing item quantity
        const newQuantity = existingItem.rows[0].quantity + quantity;
        const totalPrice = newQuantity * unitPrice;

        result = await pool.query(
          `
          UPDATE cart_items 
          SET quantity = $1, total_price = $2, special_instructions = $3, customizations = $4
          WHERE id = $5
          RETURNING *
        `,
          [
            newQuantity,
            totalPrice,
            specialInstructions,
            JSON.stringify(customizations),
            existingItem.rows[0].id,
          ]
        );
      } else {
        // Add new item
        const totalPrice = quantity * unitPrice;

        result = await pool.query(
          `
          INSERT INTO cart_items (cart_id, menu_item_id, item_name, quantity, unit_price, total_price, special_instructions, customizations)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
          [
            cartId,
            menuItemId,
            itemName,
            quantity,
            unitPrice,
            totalPrice,
            specialInstructions,
            JSON.stringify(customizations),
          ]
        );
      }

      // Update cart totals
      await this.updateCartTotals(cartId);

      logger.info(`✅ Item added to cart: ${cartId}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to add item to cart:", error.message);
      throw error;
    }
  }

  static async updateCartTotals(cartId) {
    try {
      const query = `
        UPDATE carts 
        SET total_amount = (
          SELECT COALESCE(SUM(total_price), 0) 
          FROM cart_items 
          WHERE cart_id = $1
        ),
        item_count = (
          SELECT COALESCE(SUM(quantity), 0) 
          FROM cart_items 
          WHERE cart_id = $1
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [cartId]);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to update cart totals:", error.message);
      throw error;
    }
  }

  static async getWithItems(cartId) {
    try {
      const cartQuery = "SELECT * FROM carts WHERE id = $1";
      const itemsQuery = `
        SELECT ci.*, ci.customizations
        FROM cart_items ci
        WHERE ci.cart_id = $1
        ORDER BY ci.added_at ASC
      `;

      const [cartResult, itemsResult] = await Promise.all([
        pool.query(cartQuery, [cartId]),
        pool.query(itemsQuery, [cartId]),
      ]);

      if (cartResult.rows.length === 0) {
        return null;
      }

      const cart = cartResult.rows[0];
      cart.items = itemsResult.rows.map((item) => ({
        ...item,
        customizations:
          typeof item.customizations === "string"
            ? JSON.parse(item.customizations)
            : item.customizations,
      }));

      return cart;
    } catch (error) {
      logger.error("❌ Failed to get cart with items:", error.message);
      throw error;
    }
  }

  static async removeItem(cartId, itemId) {
    try {
      const query =
        "DELETE FROM cart_items WHERE cart_id = $1 AND id = $2 RETURNING *";
      const result = await pool.query(query, [cartId, itemId]);

      if (result.rows.length === 0) {
        throw new Error("Cart item not found");
      }

      // Update cart totals
      await this.updateCartTotals(cartId);

      logger.info(`✅ Item removed from cart: ${cartId}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to remove item from cart:", error.message);
      throw error;
    }
  }

  static async clear(cartId) {
    try {
      await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

      const result = await pool.query(
        `
        UPDATE carts 
        SET total_amount = 0.00, item_count = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
        [cartId]
      );

      logger.info(`✅ Cart cleared: ${cartId}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to clear cart:", error.message);
      throw error;
    }
  }
}

module.exports = Cart;
