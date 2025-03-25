const express = require("express");
const router = express.Router();
const Cart = require("../models/cart.model");
const { addToCart, getCart, clearCart } = require("../controllers/cart.controller");
const userAuth = require("../middleware/user.middleware");
router.post("/add", userAuth, addToCart);
router.get("/", userAuth, getCart);
router.delete("/clear", userAuth, clearCart);



router.delete("/remove/:productId", userAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error removing item" });
  }
});

router.put("/update", userAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.session.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    item.quantity = Math.max(1, quantity);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error updating quantity" });
  }
});

module.exports = router;
