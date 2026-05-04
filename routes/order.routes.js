const express = require("express");
const router = express.Router();
const { verifyOrder, getMyOrders, paystackWebhook, getAdminOrders, updateOrderStatus } = require("../controllers/order.controller");
const userAuth = require("../middleware/user.middleware");
const { protect, admin } = require("../middleware/admin");
const adminAuth = require("../middleware/admin");

router.post("/verify", userAuth, verifyOrder);
router.get("/myorders", userAuth, getMyOrders);
router.post("/webhook", paystackWebhook);
router.get("/admin/all", adminAuth, getAdminOrders);

router.put("/:id/status", adminAuth, updateOrderStatus);
module.exports = router;