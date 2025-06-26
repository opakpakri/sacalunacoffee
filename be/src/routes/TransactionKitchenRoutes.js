// src/routes/TransactionKitchenRoutes.js
const express = require("express");
const router = express.Router();
const TransactionKitchenController = require("../controllers/TransactionKitchenController");

router.get("/today", TransactionKitchenController.getTodayTransactions);
router.get(
  "/:id_order/items",
  TransactionKitchenController.getOrderItemsByOrderId
);
router.put("/:id_order/status", TransactionKitchenController.updateOrderStatus);

module.exports = router;
