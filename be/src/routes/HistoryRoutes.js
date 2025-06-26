// src/routes/HistoryCashierRoutes.js
const express = require("express");
const router = express.Router();
const HistoryCashierController = require("../controllers/HistoryController"); // Pastikan path ini benar

router.get("/all", HistoryCashierController.getAllTransactions);

module.exports = router;
