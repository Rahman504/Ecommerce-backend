const axios = require("axios");
const Order = require("../models/order.model");
const crypto = require("crypto");
const Product = require("../models/product.model"); 

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
                    id: paymentReference,
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
        console.error("Verification Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Server Error: " + (error.response?.data?.message || error.message) });
    }
};

exports.paystackWebhook = async (req, res) => {
    try {
        const secret = process.env.TEST_SECRET_KEY;
        if (!secret) {
            console.error("WEBHOOK ERROR: TEST_SECRET_KEY is missing");
            return res.sendStatus(500);
        }

        const hash = crypto.createHmac('sha512', secret) 
                           .update(JSON.stringify(req.body))
                           .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            console.warn("WEBHOOK WARNING: Invalid signature");
            return res.sendStatus(400); 
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const { reference, metadata } = event.data;

            const existingOrder = await Order.findOne({ paymentReference: reference });
            
            if (!existingOrder) {
                const formattedItems = metadata.cart_items.map(item => ({
                    name: item.name,
                    qty: Number(item.qty),
                    price: Number(item.price),
                    product: item.product
                }));

                await Order.create({
                    user: metadata.user_id,
                    orderItems: formattedItems,
                    shippingAddress: metadata.shipping_address,
                    totalPrice: event.data.amount / 100, 
                    paymentReference: reference,
                    isPaid: true,
                    paidAt: Date.now(),
                    status: "Paid"
                });

                await Promise.all(formattedItems.map(async (item) => {
                    await Product.findByIdAndUpdate(
                        item.product, 
                        { $inc: { countInStock: -item.qty } } 
                    );
                }));
                
                console.log(`Webhook Success: Order ${reference} saved and stock updated.`);
            } else {
                console.log(`Webhook: Order ${reference} already exists.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook Internal Error:", error.message);
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