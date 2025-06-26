// src/routes/OrdersRoutes.js
const express = require("express");
const router = express.Router();
const OrdersController = require("../controllers/OrdersController"); // Make sure this path is correct

router.post("/", OrdersController.checkout);

// New route to update order status by ID
router.put("/:id_order/status", OrdersController.updateOrderStatus); // Add this line

module.exports = router;
