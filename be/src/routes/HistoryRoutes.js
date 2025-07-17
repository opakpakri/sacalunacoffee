// src/routes/HistoryCashierRoutes.js
const express = require("express");
const router = express.Router();
const HistoryController = require("../controllers/HistoryController"); // Pastikan path ini benar

router.get("/all", HistoryController.getAllTransactions);
router.get("/:id_order/items", HistoryController.getOrderItemsByOrderId);

module.exports = router;
