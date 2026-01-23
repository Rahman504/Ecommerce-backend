const express = require("express");
const router = express.Router();
const { verifyOrder } = require("../controllers/order.controller");
const userAuth = require("../middleware/user.middleware");
const { getMyOrders } = require("../controllers/order.controller");

router.post("/verify", userAuth, verifyOrder);
router.get("/myorders", userAuth, getMyOrders);

module.exports = router;