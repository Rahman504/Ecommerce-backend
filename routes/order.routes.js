const express = require("express");
const router = express.Router();
const { verifyOrder, getMyOrders, paystackWebhook } = require("../controllers/order.controller");
const userAuth = require("../middleware/user.middleware");

router.post("/verify", userAuth, verifyOrder);
router.get("/myorders", userAuth, getMyOrders);
router.post("/webhook", paystackWebhook);

module.exports = router;