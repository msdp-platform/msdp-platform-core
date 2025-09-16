const express = require("express");
const router = express.Router();
const { authenticateAdmin, requireAdminRole } = require("../middleware/auth");
const pool = require("../config/database");

// ✅ Audit Logging (Admin Service owns audit trail)
router.get("/logs", authenticateAdmin, async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      adminId,
      action,
      resourceType,
      limit = 100,
      offset = 0,
    } = req.query;

    let query = `
      SELECT 
        al.*,
        au.name as admin_name,
        au.email as admin_email
      FROM admin_audit_logs al
      LEFT JOIN admin_users au ON al.admin_user_id = au.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      query += ` AND al.timestamp >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND al.timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    if (adminId) {
      paramCount++;
      query += ` AND al.admin_user_id = $${paramCount}`;
      params.push(adminId);
    }

    if (action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
    }

    if (resourceType) {
      paramCount++;
      query += ` AND al.resource_type = $${paramCount}`;
      params.push(resourceType);
    }

    query += ` ORDER BY al.timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      pagination: { limit, offset },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logs", authenticateAdmin, async (req, res, next) => {
  try {
    const { action, resourceType, resourceId, details } = req.body;
    const adminId = req.admin.id;
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent");

    const query = `
      INSERT INTO admin_audit_logs 
      (admin_user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      adminId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
      userAgent,
    ]);

    res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Compliance Reporting (Admin Service responsibility)
router.get(
  "/compliance/report",
  authenticateAdmin,
  requireAdminRole(["admin", "super_admin"]),
  async (req, res, next) => {
    try {
      const { type = "general", startDate, endDate } = req.query;

      let query = `
      SELECT 
        action,
        resource_type,
        COUNT(*) as action_count,
        DATE(timestamp) as action_date
      FROM admin_audit_logs
      WHERE 1=1
    `;

      const params = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND timestamp >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND timestamp <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` GROUP BY action, resource_type, DATE(timestamp) ORDER BY action_date DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        reportType: type,
        period: { startDate, endDate },
        data: result.rows,
        generatedAt: new Date().toISOString(),
        generatedBy: req.admin.id,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
