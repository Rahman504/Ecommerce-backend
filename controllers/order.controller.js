const axios = require("axios");
const Order = require("../models/order.model");
const crypto = require("crypto");
const Product = require("../models/product.model");
const sendReceipt = require("../utils/emailService");

exports.verifyOrder = async (req, res) => {
    const { paymentReference, cart, shippingAddress, amount } = req.body;
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ message: "Not authorized" });

        const response = await axios.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
            headers: { Authorization: `Bearer ${process.env.TEST_SECRET_KEY}` },
        });

        if (response.data.data.status === "success") {
            const existingOrder = await Order.findOne({ paymentReference });
            if (existingOrder) return res.status(200).json(existingOrder);

            const orderItems = cart.map(item => ({
                name: item.product?.name,
                qty: Number(item.quantity),
                price: Number(item.product?.discountedPrice),
                product: item.product?._id
            }));

            const newOrder = new Order({
                user: req.user.id,
                orderItems,
                shippingAddress,
                totalPrice: amount,
                paymentReference,
                isPaid: true,
                paidAt: Date.now(),
                status: "Paid"
            });

            const savedOrder = await newOrder.save();

            // Reduce Stock
            await Promise.all(orderItems.map(async (item) => {
                await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -item.qty } });
            }));

            // Send Email
            await sendReceipt(response.data.data.customer.email, savedOrder);

            return res.status(201).json(savedOrder);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.paystackWebhook = async (req, res) => {
    try {
        const hash = crypto.createHmac('sha512', process.env.TEST_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
        if (hash !== req.headers['x-paystack-signature']) return res.sendStatus(400);

        const event = req.body;
        if (event.event === 'charge.success') {
            const { reference, metadata, customer } = event.data;
            const existingOrder = await Order.findOne({ paymentReference: reference });

            if (!existingOrder) {
                const orderData = {
                    user: metadata.user_id,
                    orderItems: metadata.cart_items,
                    shippingAddress: metadata.shipping_address,
                    totalPrice: event.data.amount / 100,
                    paymentReference: reference,
                    isPaid: true,
                    paidAt: Date.now(),
                    status: "Paid"
                };

                const savedOrder = await Order.create(orderData);

                await Promise.all(metadata.cart_items.map(async (item) => {
                    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -item.qty } });
                }));

                await sendReceipt(customer.email, savedOrder);
            }
        }
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Error updating status" });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
};