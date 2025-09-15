const { Pool } = require("pg");
const Joi = require("joi");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Validation schemas
const countrySchema = Joi.object({
  country_code: Joi.string().length(3).required(),
  country_name: Joi.string().min(2).max(100).required(),
  currency_code: Joi.string().length(3).default("USD"),
  timezone: Joi.string().default("UTC"),
});

const regionSchema = Joi.object({
  country_id: Joi.number().integer().required(),
  region_code: Joi.string().max(10).required(),
  region_name: Joi.string().min(2).max(100).required(),
  region_type: Joi.string()
    .valid("state", "province", "territory", "city-state")
    .default("state"),
});

const citySchema = Joi.object({
  district_id: Joi.number().integer().required(),
  city_code: Joi.string().max(20).required(),
  city_name: Joi.string().min(2).max(100).required(),
  city_type: Joi.string().valid("city", "town", "municipality").default("city"),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  population: Joi.number().integer().min(0),
});

// Countries
const getCountries = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, country_code, country_name, currency_code, timezone, 
             is_active, enabled_at, created_at, updated_at
      FROM countries 
      ORDER BY country_name
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

const createCountry = async (req, res, next) => {
  try {
    const { error, value } = countrySchema.validate(req.body);
    if (error) throw error;

    const { rows } = await pool.query(
      `
      INSERT INTO countries (country_code, country_name, currency_code, timezone, is_active, enabled_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        value.country_code,
        value.country_name,
        value.currency_code,
        value.timezone,
        true,
        new Date(),
      ]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "Country created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateCountry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = countrySchema.validate(req.body);
    if (error) throw error;

    const { rows } = await pool.query(
      `
      UPDATE countries 
      SET country_code = $1, country_name = $2, currency_code = $3, 
          timezone = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `,
      [
        value.country_code,
        value.country_name,
        value.currency_code,
        value.timezone,
        id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "Country updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteCountry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      DELETE FROM countries WHERE id = $1 RETURNING *
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    res.json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Regions
const getRegions = async (req, res, next) => {
  try {
    const { countryId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT r.id, r.region_code, r.region_name, r.region_type, 
             r.is_active, r.enabled_at, r.created_at, r.updated_at,
             c.country_name
      FROM regions r
      JOIN countries c ON r.country_id = c.id
      WHERE r.country_id = $1
      ORDER BY r.region_name
    `,
      [countryId]
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

const createRegion = async (req, res, next) => {
  try {
    const { error, value } = regionSchema.validate(req.body);
    if (error) throw error;

    const { rows } = await pool.query(
      `
      INSERT INTO regions (country_id, region_code, region_name, region_type, is_active, enabled_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        value.country_id,
        value.region_code,
        value.region_name,
        value.region_type,
        true,
        new Date(),
      ]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "Region created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Cities
const getCities = async (req, res, next) => {
  try {
    const { districtId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT c.id, c.city_code, c.city_name, c.city_type, 
             c.latitude, c.longitude, c.population,
             c.is_active, c.enabled_at, c.created_at, c.updated_at,
             d.district_name, r.region_name, co.country_name
      FROM cities c
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      JOIN countries co ON r.country_id = co.id
      WHERE c.district_id = $1
      ORDER BY c.city_name
    `,
      [districtId]
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

const getAllCities = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.city_code, c.city_name, c.city_type, 
             c.latitude, c.longitude, c.population,
             c.is_active, c.enabled_at, c.created_at, c.updated_at,
             d.district_name, r.region_name, co.country_name
      FROM cities c
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      JOIN countries co ON r.country_id = co.id
      ORDER BY co.country_name, r.region_name, c.city_name
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

const createCity = async (req, res, next) => {
  try {
    const { error, value } = citySchema.validate(req.body);
    if (error) throw error;

    const { rows } = await pool.query(
      `
      INSERT INTO cities (district_id, city_code, city_name, city_type, 
                         latitude, longitude, population, is_active, enabled_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        value.district_id,
        value.city_code,
        value.city_name,
        value.city_type,
        value.latitude,
        value.longitude,
        value.population,
        true,
        new Date(),
      ]
    );

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "City created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Service Enablement
const getCityServices = async (req, res, next) => {
  try {
    const { cityId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT lse.id, lse.is_enabled, lse.enabled_at, lse.delivery_radius_km,
             lse.min_order_amount, lse.commission_rate,
             sc.category_code, sc.category_name, sc.description, sc.icon
      FROM location_service_enablement lse
      JOIN service_categories sc ON lse.service_category_id = sc.id
      WHERE lse.city_id = $1
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

const enableServiceInCity = async (req, res, next) => {
  try {
    const { cityId, serviceId } = req.params;
    const {
      delivery_radius_km = 10.0,
      min_order_amount = 0.0,
      commission_rate = 5.0,
    } = req.body;

    const { rows } = await pool.query(
      `
      INSERT INTO location_service_enablement 
      (city_id, service_category_id, is_enabled, enabled_at, delivery_radius_km, min_order_amount, commission_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (city_id, service_category_id)
      DO UPDATE SET 
        is_enabled = $3,
        enabled_at = $4,
        delivery_radius_km = $5,
        min_order_amount = $6,
        commission_rate = $7,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
      [
        cityId,
        serviceId,
        true,
        new Date(),
        delivery_radius_km,
        min_order_amount,
        commission_rate,
      ]
    );

    res.json({
      success: true,
      data: rows[0],
      message: "Service enabled in city successfully",
    });
  } catch (error) {
    next(error);
  }
};

const disableServiceInCity = async (req, res, next) => {
  try {
    const { cityId, serviceId } = req.params;

    const { rows } = await pool.query(
      `
      UPDATE location_service_enablement 
      SET is_enabled = false, updated_at = CURRENT_TIMESTAMP
      WHERE city_id = $1 AND service_category_id = $2
      RETURNING *
    `,
      [cityId, serviceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service enablement not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
      message: "Service disabled in city successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Placeholder methods for other endpoints
const updateRegion = async (req, res, next) => {
  res.json({ success: true, message: "Update region - to be implemented" });
};

const deleteRegion = async (req, res, next) => {
  res.json({ success: true, message: "Delete region - to be implemented" });
};

const getDistricts = async (req, res, next) => {
  res.json({ success: true, message: "Get districts - to be implemented" });
};

const createDistrict = async (req, res, next) => {
  res.json({ success: true, message: "Create district - to be implemented" });
};

const updateDistrict = async (req, res, next) => {
  res.json({ success: true, message: "Update district - to be implemented" });
};

const deleteDistrict = async (req, res, next) => {
  res.json({ success: true, message: "Delete district - to be implemented" });
};

const updateCity = async (req, res, next) => {
  res.json({ success: true, message: "Update city - to be implemented" });
};

const deleteCity = async (req, res, next) => {
  res.json({ success: true, message: "Delete city - to be implemented" });
};

const getDeliveryZones = async (req, res, next) => {
  res.json({
    success: true,
    message: "Get delivery zones - to be implemented",
  });
};

const createDeliveryZone = async (req, res, next) => {
  res.json({
    success: true,
    message: "Create delivery zone - to be implemented",
  });
};

const updateDeliveryZone = async (req, res, next) => {
  res.json({
    success: true,
    message: "Update delivery zone - to be implemented",
  });
};

const deleteDeliveryZone = async (req, res, next) => {
  res.json({
    success: true,
    message: "Delete delivery zone - to be implemented",
  });
};

const getLocalRegulations = async (req, res, next) => {
  res.json({
    success: true,
    message: "Get local regulations - to be implemented",
  });
};

const createLocalRegulation = async (req, res, next) => {
  res.json({
    success: true,
    message: "Create local regulation - to be implemented",
  });
};

const updateLocalRegulation = async (req, res, next) => {
  res.json({
    success: true,
    message: "Update local regulation - to be implemented",
  });
};

const deleteLocalRegulation = async (req, res, next) => {
  res.json({
    success: true,
    message: "Delete local regulation - to be implemented",
  });
};

module.exports = {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  getDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getCities,
  getAllCities,
  createCity,
  updateCity,
  deleteCity,
  getCityServices,
  enableServiceInCity,
  disableServiceInCity,
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  getLocalRegulations,
  createLocalRegulation,
  updateLocalRegulation,
  deleteLocalRegulation,
};
