const jwt = require("jsonwebtoken");
const Cart = require("../models/cart.model");
const User = require("../models/user.model"); 

const addToCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; 
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
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
        res.status(200).json({ message: "Item added to cart successfully!", cart });

    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};
const getCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.id;

        const cart = await Cart.findOne({ user: userId }).populate("items.product");

        if (!cart) {
            return res.status(200).json({ cart: [] });
        }

        res.status(200).json({ cart: cart.items });

    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
};
const clearCart = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; 
        if (!token) {
            return res.status(401).json({ message: "Unauthorized. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY); 
        const userId = decoded.id; 

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "No cart found for user." });
        }

        cart.items = []; 
        await cart.save();

        res.status(200).json({ message: "Cart cleared successfully!" });

    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ message: "Server error. Failed to clear cart." });
    }
};


module.exports = { addToCart, getCart, clearCart };

