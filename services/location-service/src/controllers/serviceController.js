const { Pool } = require("pg");
const Joi = require("joi");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Validation schemas
const serviceCategorySchema = Joi.object({
  category_code: Joi.string().max(20).required(),
  category_name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500),
  icon: Joi.string().max(50),
});

// Service Categories
const getServiceCategories = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, category_code, category_name, description, icon, 
             is_active, created_at, updated_at
      FROM service_categories 
      ORDER BY category_name
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    next(error);
  }
};

const createServiceCategory = async (req, res, next) => {
  try {
    const { error, value } = serviceCategorySchema.validate(req.body);
    if (error) throw error;

    const { rows } = await pool.query(
      `
      INSERT INTO service_categories (category_code, category_name, description, icon, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [
        value.category_code,
        value.category_name,
        value.description,
        value.icon,
        true,
      ]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "Service category created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateServiceCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = serviceCategorySchema.validate(req.body);
    if (error) throw error;

    const { rows } = await pool.query(
      `
      UPDATE service_categories 
      SET category_code = $1, category_name = $2, description = $3, 
          icon = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `,
      [
        value.category_code,
        value.category_name,
        value.description,
        value.icon,
        id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service category not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "Service category updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteServiceCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      DELETE FROM service_categories WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service category not found",
      });
    }

    res.json({
      success: true,
      message: "Service category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Service Enablement Status
const getServiceEnablementStatus = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        sc.id as service_id,
        sc.category_code,
        sc.category_name,
        sc.icon,
        COUNT(lse.city_id) as enabled_cities_count,
        COUNT(c.id) as total_cities_count,
        ROUND(AVG(lse.commission_rate), 2) as avg_commission_rate,
        ROUND(AVG(lse.delivery_radius_km), 2) as avg_delivery_radius
      FROM service_categories sc
      LEFT JOIN location_service_enablement lse ON sc.id = lse.service_category_id AND lse.is_enabled = true
      LEFT JOIN cities c ON c.is_active = true
      WHERE sc.is_active = true
      GROUP BY sc.id, sc.category_code, sc.category_name, sc.icon
      ORDER BY sc.category_name
    `);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    next(error);
  }
};

const getCityServiceEnablementStatus = async (req, res, next) => {
  try {
    const { cityId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT 
        sc.id as service_id,
        sc.category_code,
        sc.category_name,
        sc.icon,
        lse.is_enabled,
        lse.enabled_at,
        lse.delivery_radius_km,
        lse.min_order_amount,
        lse.commission_rate
      FROM service_categories sc
      LEFT JOIN location_service_enablement lse ON sc.id = lse.service_category_id AND lse.city_id = $1
      WHERE sc.is_active = true
      ORDER BY sc.category_name
    `,
      [cityId]
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getServiceEnablementStatus,
  getCityServiceEnablementStatus,
};
