const express = require("express");
const Cart = require("../models/Cart");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// ✅ All cart routes require user authentication
router.use(authenticateUser);

// ✅ Create or Get Cart
router.post("/create", async (req, res, next) => {
  try {
    const { merchantId, countryCode } = req.body;
    const userId = req.user.userId;

    // Check if user already has an active cart for this merchant
    let cart = await Cart.findByUser(userId, merchantId);

    if (!cart) {
      cart = await Cart.create(userId, merchantId, countryCode);
    }

    res.status(201).json({
      success: true,
      message: "Cart ready",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Add Item to Cart
router.post("/:cartId/items", async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const itemData = req.body;

    const cartItem = await Cart.addItem(cartId, itemData);

    res.json({
      success: true,
      message: "Item added to cart",
      data: cartItem,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Get Cart with Items
router.get("/:cartId", async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.getWithItems(cartId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Remove Item from Cart
router.delete("/:cartId/items/:itemId", async (req, res, next) => {
  try {
    const { cartId, itemId } = req.params;

    const removedItem = await Cart.removeItem(cartId, itemId);

    res.json({
      success: true,
      message: "Item removed from cart",
      data: removedItem,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Clear Cart
router.delete("/:cartId/clear", async (req, res, next) => {
  try {
    const { cartId } = req.params;

    const cart = await Cart.clear(cartId);

    res.json({
      success: true,
      message: "Cart cleared",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
