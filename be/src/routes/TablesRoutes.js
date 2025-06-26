// routes/TablesRoutes.js
const express = require("express");
const router = express.Router();
const {
  getTableByNumber,
  getAllTablesCashier,
  generateQrToken,
  addTable,
  updateTable,
  getTableById, // Import getTableById
  deleteTable,
} = require("../controllers/TablesController");
const validateQrToken = require("../middlewares/QrcodeMiddleware");

// GET semua meja
router.get("/all", getAllTablesCashier);

// 🛠️ VALIDATE: diletakkan sebelum `/:number` (penting agar middleware bekerja)
router.get("/validate/:table_number/:token", validateQrToken, (req, res) => {
  res.json({ success: true });
});

// ✅ PERBAIKAN DI SINI: Pindahkan GET by ID ke atas GET by Number
router.get("/:id", getTableById); // Ini akan menangkap ID seperti '4'

// GET meja berdasarkan nomor meja (ini akan menangkap string seperti 'SC1', 'SC2')
// Jika nomor meja Anda bisa berupa angka murni (misal '10'), ini masih bisa konflik.
// Untuk menghindari konflik total, gunakan route spesifik seperti /number/:number
router.get("/number/:number", getTableByNumber); // Ini untuk nomor meja (misal SC1, SC2)

// POST untuk generate QR token
router.post("/generate-qr/:id_table", generateQrToken);

// POST untuk menambahkan meja baru
router.post("/add", addTable);

// PUT untuk mengedit meja yang sudah ada berdasarkan ID
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

module.exports = router;
