const MenuItem = require("../models/MenuItem");
const Joi = require("joi");

// Validation schemas
const menuItemSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().required().min(1).max(500),
  price: Joi.number().required().min(0),
  category: Joi.string()
    .required()
    .valid(
      "Pizza",
      "Burgers",
      "Salads",
      "Pasta",
      "Appetizers",
      "Main Course",
      "Desserts",
      "Beverages",
      "Sides"
    ),
  status: Joi.string()
    .valid("active", "inactive", "out_of_stock")
    .default("active"),
  stock: Joi.number().integer().min(0).default(0),
  preparation_time: Joi.number().integer().min(0),
  is_vegetarian: Joi.boolean().default(false),
  is_vegan: Joi.boolean().default(false),
  is_gluten_free: Joi.boolean().default(false),
  calories: Joi.number().integer().min(0),
  serving_size: Joi.string().max(50),
  ingredients: Joi.array().items(Joi.string()).default([]),
  allergens: Joi.array().items(Joi.string()).default([]),
  tags: Joi.array().items(Joi.string()).default([]),
  image_url: Joi.string().uri().allow(""),
});

// Get all menu items for a merchant
const getMenuItems = async (req, res) => {
  try {
    const { merchant_id } = req.user;
    const { category, status, search } = req.query;

    const filters = { category, status, search };
    const menuItems = await MenuItem.findAll(merchant_id, filters);

    res.json({
      success: true,
      data: menuItems,
      count: menuItems.length,
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu items",
      error: error.message,
    });
  }
};

// Get a single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { merchant_id } = req.user;

    const menuItem = await MenuItem.findById(id, merchant_id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
      error: error.message,
    });
  }
};

// Create a new menu item
const createMenuItem = async (req, res) => {
  try {
    const { error, value } = menuItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const menuItemData = {
      ...value,
      merchant_id: req.user.merchant_id,
    };

    const menuItem = await MenuItem.create(menuItemData);

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: menuItem,
    });
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create menu item",
      error: error.message,
    });
  }
};

// Update a menu item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { merchant_id } = req.user;

    // Check if menu item exists
    const existingItem = await MenuItem.findById(id, merchant_id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const { error, value } = menuItemSchema.validate(req.body, {
      allowUnknown: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const updatedItem = await MenuItem.update(id, merchant_id, value);

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update menu item",
      error: error.message,
    });
  }
};

// Delete a menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { merchant_id } = req.user;

    const deletedItem = await MenuItem.delete(id, merchant_id);
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully",
      data: deletedItem,
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
      error: error.message,
    });
  }
};

// Get menu statistics
const getMenuStats = async (req, res) => {
  try {
    const { merchant_id } = req.user;
    const stats = await MenuItem.getStats(merchant_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching menu stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuStats,
};
