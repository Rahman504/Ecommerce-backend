const axios = require("axios");
const Order = require("../models/order.model");
const crypto = require("crypto");

exports.verifyOrder = async (req, res) => {
    const { paymentReference, cart, shippingAddress, amount } = req.body;

    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Not authorized, no user ID found" });
        }

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${paymentReference}`,
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
                paymentReference: paymentReference,
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


exports.paystackWebhook = async (req, res) => {
    try {
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                           .update(JSON.stringify(req.body))
                           .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.sendStatus(400); 
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const { reference, metadata } = event.data;

            const existingOrder = await Order.findOne({ paymentReference: reference });
            
            if (!existingOrder) {
                await Order.create({
                    user: metadata.user_id,
                    orderItems: metadata.cart_items,
                    shippingAddress: metadata.shipping_address,
                    totalPrice: event.data.amount / 100,
                    paymentReference: reference,
                    status: "Paid"
                });
                console.log(`Webhook: Order ${reference} saved successfully.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook Error:", error);
        res.sendStatus(500);
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