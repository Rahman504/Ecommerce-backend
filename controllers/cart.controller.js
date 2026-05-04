const jwt = require("jsonwebtoken");
const Cart = require("../models/cart.model");
const User = require("../models/user.model");

const addToCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        const { product, quantity } = req.body;
        const existingItem = cart.items.find(item => item.product.toString() === product);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product, quantity });
        }
        await cart.save();
        res.status(200).json({ message: "Success", cart });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const getCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const cart = await Cart.findOne({ user: decoded.id }).populate("items.product");
        if (!cart) return res.status(200).json({ cart: [] });
        res.status(200).json({ cart: cart.items });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const updateCartQuantity = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { productId, quantity } = req.body;
        const cart = await Cart.findOne({ user: decoded.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
        const item = cart.items.find(item => item.product.toString() === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            await cart.save();
        }
        res.status(200).json({ message: "Updated", cart: cart.items });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { productId } = req.params;
        const cart = await Cart.findOne({ user: decoded.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();
        res.status(200).json({ message: "Removed", cart: cart.items });
    } catch (error) {
        res.status(500).json({ message: "Removal failed" });
    }
};

const clearCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const cart = await Cart.findOne({ user: decoded.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.status(200).json({ message: "Cleared" });
    } catch (error) {
        res.status(500).json({ message: "Clear failed" });
    }
};

module.exports = { addToCart, getCart, clearCart, updateCartQuantity, removeFromCart };