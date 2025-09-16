const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

class User {
  // ✅ User Service owns customer user data
  static async create(userData) {
    const {
      email,
      password,
      name,
      phone,
      countryCode = "US",
      preferences = {},
    } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const query = `
        INSERT INTO users (
          id, email, password_hash, name, phone, country_code, 
          preferences, email_verified, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING id, email, name, phone, country_code, preferences, 
                  email_verified, created_at
      `;

      const userId = uuidv4();
      const result = await pool.query(query, [
        userId,
        email.toLowerCase(),
        hashedPassword,
        name,
        phone,
        countryCode.toUpperCase(),
        JSON.stringify(preferences),
        false, // email_verified
      ]);

      logger.info(`✅ User created: ${email} (${countryCode})`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to create user:", error.message);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = `
        SELECT id, email, password_hash, name, phone, country_code, 
               preferences, email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE email = $1
      `;
      const result = await pool.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("❌ Failed to find user by email:", error.message);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT id, email, name, phone, country_code, preferences, 
               email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("❌ Failed to find user by id:", error.message);
      throw error;
    }
  }

  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new Error("Invalid credentials");
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      // Update last login
      await pool.query(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
        [user.id]
      );

      logger.info(`✅ User authenticated: ${email}`);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        countryCode: user.country_code,
        preferences:
          typeof user.preferences === "string"
            ? JSON.parse(user.preferences)
            : user.preferences,
        emailVerified: user.email_verified,
      };
    } catch (error) {
      logger.error("❌ User authentication failed:", error.message);
      throw error;
    }
  }

  static async updateProfile(id, updates) {
    try {
      const { name, phone, preferences } = updates;

      const query = `
        UPDATE users 
        SET name = COALESCE($2, name),
            phone = COALESCE($3, phone),
            preferences = COALESCE($4, preferences),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, phone, country_code, preferences, 
                  email_verified, updated_at
      `;

      const result = await pool.query(query, [
        id,
        name,
        phone,
        preferences ? JSON.stringify(preferences) : null,
      ]);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      logger.info(`✅ User profile updated: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to update user profile:", error.message);
      throw error;
    }
  }

  static async setLocation(userId, locationData) {
    try {
      const { countryCode, city, postalCode, coordinates } = locationData;

      const query = `
        INSERT INTO user_locations (user_id, country_code, city, postal_code, coordinates, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          country_code = EXCLUDED.country_code,
          city = EXCLUDED.city,
          postal_code = EXCLUDED.postal_code,
          coordinates = EXCLUDED.coordinates,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        countryCode?.toUpperCase(),
        city,
        postalCode,
        coordinates ? JSON.stringify(coordinates) : null,
      ]);

      logger.info(
        `✅ User location updated: ${userId} -> ${city}, ${countryCode}`
      );
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to set user location:", error.message);
      throw error;
    }
  }

  static async getUserLocation(userId) {
    try {
      const query = `
        SELECT country_code, city, postal_code, coordinates, updated_at
        FROM user_locations
        WHERE user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("❌ Failed to get user location:", error.message);
      throw error;
    }
  }

  static async verifyEmail(userId) {
    try {
      const query = `
        UPDATE users 
        SET email_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, email_verified
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      logger.info(`✅ Email verified for user: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error("❌ Failed to verify email:", error.message);
      throw error;
    }
  }
}

module.exports = User;
