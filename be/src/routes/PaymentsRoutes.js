// src/routes/PaymentsRoutes.js
const express = require("express");
const router = express.Router();
const PaymentsController = require("../controllers/PaymentsController");

// Existing routes
router.post("/success", PaymentsController.markPaymentSuccess);
router.post("/expire", PaymentsController.markExpiredPaymentsAsFailed); // For automated tasks
router.post("/cancel", PaymentsController.cancelPaymentAndOrder); // For frontend Cancel button
router.get("/details", PaymentsController.getPaymentDetailsByToken);
// Route used by Cashier's TransactionsPage to manually update status
router.put("/:id_payment/status", PaymentsController.updatePaymentStatus);

module.exports = router;
