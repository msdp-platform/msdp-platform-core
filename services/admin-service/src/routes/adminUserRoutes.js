const express = require("express");
const router = express.Router();
const AdminUser = require("../models/AdminUser");
const jwt = require("jsonwebtoken");
const { authenticateAdmin, requireAdminRole } = require("../middleware/auth");

// ✅ Admin Authentication (Admin Service owns admin users)
router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const adminUser = await AdminUser.authenticate(email, password);

    const token = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      process.env.JWT_SECRET || "admin-service-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      data: {
        token,
        user: adminUser,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Admin User CRUD (Admin Service responsibility)
router.get("/", authenticateAdmin, async (req, res, next) => {
  try {
    const users = await AdminUser.getAll();
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authenticateAdmin,
  requireAdminRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const user = await AdminUser.create(req.body);
      res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/role",
  authenticateAdmin,
  requireAdminRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role, permissions } = req.body;

      const user = await AdminUser.updateRole(id, role, permissions);
      res.json({
        success: true,
        message: "Admin user role updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  authenticateAdmin,
  requireAdminRole(["super_admin"]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await AdminUser.delete(id);
      res.json({
        success: true,
        message: "Admin user deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
