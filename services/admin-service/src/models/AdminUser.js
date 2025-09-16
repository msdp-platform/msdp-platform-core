const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

class AdminUser {
  // ✅ Admin User Management (Admin Service owns this data)
  static async create(userData) {
    const { email, name, role = "admin", permissions = [] } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error("Admin user with this email already exists");
      }

      const query = `
        INSERT INTO admin_users (email, name, role, permissions, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id, email, name, role, permissions, created_at
      `;

      const result = await pool.query(query, [
        email,
        name,
        role,
        JSON.stringify(permissions),
      ]);
      logger.info(`✅ Admin user created: ${email} with role: ${role}`);

      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to create admin user:", error.message);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = "SELECT * FROM admin_users WHERE email = $1";
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("❌ Failed to find admin user by email:", error.message);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = "SELECT * FROM admin_users WHERE id = $1";
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("❌ Failed to find admin user by id:", error.message);
      throw error;
    }
  }

  static async getAll() {
    try {
      const query = `
        SELECT id, email, name, role, permissions, created_at, updated_at
        FROM admin_users 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error("❌ Failed to get admin users:", error.message);
      throw error;
    }
  }

  static async updateRole(id, role, permissions = []) {
    try {
      const query = `
        UPDATE admin_users 
        SET role = $2, permissions = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, role, permissions, updated_at
      `;

      const result = await pool.query(query, [
        id,
        role,
        JSON.stringify(permissions),
      ]);

      if (result.rows.length === 0) {
        throw new Error("Admin user not found");
      }

      logger.info(`✅ Admin user role updated: ${id} to ${role}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to update admin user role:", error.message);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = "DELETE FROM admin_users WHERE id = $1 RETURNING email";
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error("Admin user not found");
      }

      logger.info(`✅ Admin user deleted: ${result.rows[0].email}`);
      return { success: true, deletedEmail: result.rows[0].email };
    } catch (error) {
      logger.error("❌ Failed to delete admin user:", error.message);
      throw error;
    }
  }

  // ✅ Authentication functions (Admin Service responsibility)
  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // For now, simple password check (in production, use proper hashing)
      if (password !== "admin123") {
        throw new Error("Invalid credentials");
      }

      logger.info(`✅ Admin user authenticated: ${email}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions:
          typeof user.permissions === "string"
            ? JSON.parse(user.permissions)
            : user.permissions,
      };
    } catch (error) {
      logger.error("❌ Admin authentication failed:", error.message);
      throw error;
    }
  }
}

module.exports = AdminUser;
