const axios = require("axios");
const Order = require("../models/order.model");

exports.verifyOrder = async (req, res) => {
    const { reference, cart, shippingAddress, amount } = req.body;

    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Not authorized, no user ID found" });
        }

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TEST_SECRET_KEY}`,
                },
            }
        );

        if (response.data.data.status === "success") {
            const orderItems = cart.map(item => ({
                name: item.product?.name || "Product Name",
                qty: Number(item.quantity),
                price: Number(item.product?.discountedPrice || 0),
                product: item.product?._id
            }));

            const newOrder = new Order({
                user: req.user.id,
                orderItems,
                shippingAddress: {
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    phone: shippingAddress.phone
                },
                totalPrice: amount,
                isPaid: true,
                paidAt: Date.now(),
                paymentResult: {
                    id: reference,
                    status: "success",
                    email: response.data.data.customer.email
                }
            });

            const savedOrder = await newOrder.save();
            return res.status(201).json(savedOrder);
        } else {
            return res.status(400).json({ message: "Paystack did not confirm payment" });
        }
    } catch (error) {
        console.error("Verification Error:", error.message);
        res.status(500).json({ message: "Server Error: " + error.message });
    }
};
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};