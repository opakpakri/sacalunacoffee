// src/routes/TransactionCashierRoutes.js
const express = require("express");
const router = express.Router();
const TransactionCashierController = require("../controllers/TransactionCashierController");

router.get("/today", TransactionCashierController.getTodayTransactions);

// New route to get order items by order ID
router.get(
  "/:id_order/items",
  TransactionCashierController.getOrderItemsByOrderId
);

module.exports = router;
