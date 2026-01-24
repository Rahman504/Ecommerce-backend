const express = require("express");
const router = express.Router();
const { 
  addToCart, 
  getCart, 
  clearCart, 
  updateCartQuantity, 
  removeFromCart 
} = require("../controllers/cart.controller");
const userAuth = require("../middleware/user.middleware");

router.post("/add", userAuth, addToCart);
router.get("/", userAuth, getCart);
router.delete("/clear", userAuth, clearCart);
router.delete("/remove/:productId", userAuth, removeFromCart);
router.put("/update", userAuth, updateCartQuantity);

module.exports = router;