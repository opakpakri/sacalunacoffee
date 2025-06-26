// TablesController.js
const fs = require("fs");
const pool = require("../config/db"); // Menggunakan pool untuk koneksi DB
const path = require("path");
const crypto = require("crypto");

const getTableByNumber = async (req, res) => {
  const { number } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tables WHERE table_number = ?",
      [number]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching table:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllTablesCashier = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tables ORDER BY table_number ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching tables (cashier):", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const generateQrToken = async (req, res) => {
  const { id_table } = req.params;
  const force = req.query.force === "true";
  const now = new Date();

  try {
    const [rows] = await pool.query(
      "SELECT table_number, qr_token, qr_generated_at FROM tables WHERE id_table = ?",
      [id_table]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Table not found" });
    }

    const { qr_token, qr_generated_at, table_number } = rows[0];

    // Cek apakah token masih berlaku (kurang dari 10 menit = 600 detik)
    if (!force && qr_token && qr_generated_at) {
      const generatedAt = new Date(qr_generated_at);
      const diffSeconds = (now - generatedAt) / 1000;
      if (diffSeconds < 600) {
        // Token masih berlaku (misal 10 menit)
        return res.json({
          success: true,
          qr_token,
          qr_generated_at,
          reused: true,
        });
      }
    }

    // Jika token tidak ada, sudah expired, atau di-force regenerate
    const token = crypto.randomBytes(16).toString("hex");

    await pool.query(
      "UPDATE tables SET qr_token = ?, qr_generated_at = ? WHERE id_table = ?",
      [token, now, id_table]
    );

    res.json({
      success: true,
      qr_token: token,
      qr_generated_at: now,
      reused: false,
    });
  } catch (error) {
    console.error("generateQrToken error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fungsi BARU: Menambahkan meja baru
const addTable = async (req, res) => {
  const { table_number } = req.body;

  // Validasi input
  if (!table_number) {
    return res.status(400).json({ message: "Nomor meja harus diisi." });
  }

  try {
    // Cek apakah nomor meja sudah ada
    const [existingTable] = await pool.query(
      "SELECT id_table FROM tables WHERE table_number = ?",
      [table_number]
    );

    if (existingTable.length > 0) {
      return res.status(409).json({ message: "Nomor meja sudah ada." }); // Conflict
    }

    // Insert meja baru
    // qr_token dan qr_generated_at bisa null awalnya, akan di-generate saat pertama kali digunakan
    const [result] = await pool.query(
      "INSERT INTO tables (table_number, qr_token, qr_generated_at) VALUES (?, ?, ?)",
      [table_number, "", ""]
    );

    res.status(201).json({
      success: true,
      message: "Meja berhasil ditambahkan!",
      id_table: result.insertId,
    });
  } catch (error) {
    console.error("Error adding table:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const updateTable = async (req, res) => {
  const { id } = req.params; // Ambil id_table dari parameter URL
  const { table_number } = req.body; // Ambil nomor meja baru dari body

  // Validasi input
  if (!table_number) {
    return res.status(400).json({ message: "Nomor meja tidak boleh kosong." });
  }

  try {
    // Cek apakah nomor meja yang baru sudah ada untuk meja lain
    const [existingTable] = await pool.query(
      "SELECT id_table FROM tables WHERE table_number = ? AND id_table != ?",
      [table_number, id] // Pastikan bukan ID meja yang sedang diedit itu sendiri
    );

    if (existingTable.length > 0) {
      return res
        .status(409)
        .json({ message: "Nomor meja sudah ada untuk meja lain." });
    }

    // Update nomor meja
    const [result] = await pool.query(
      "UPDATE tables SET table_number = ? WHERE id_table = ?",
      [table_number, id]
    );

    if (result.affectedRows === 0) {
      // Jika tidak ada baris yang terpengaruh, berarti ID meja tidak ditemukan
      return res.status(404).json({ message: "Meja tidak ditemukan." });
    }

    res
      .status(200)
      .json({ success: true, message: "Nomor meja berhasil diperbarui!" });
  } catch (error) {
    console.error("Error updating table:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getTableById = async (req, res) => {
  const { id } = req.params; // This `id` should be '4' based on your error

  try {
    const [rows] = await pool.query(
      "SELECT * FROM tables WHERE id_table = ?", // Query by id_table
      [id]
    );

    if (rows.length === 0) {
      // This is where the 404 is triggered
      return res.status(404).json({ message: "Table not found." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching table by ID:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const deleteTable = async (req, res) => {
  const { id } = req.params; // Ambil id_table dari parameter URL

  try {
    // Cek apakah meja ada sebelum dihapus (opsional, tapi baik untuk respons)
    const [existingTable] = await pool.query(
      "SELECT id_table FROM tables WHERE id_table = ?",
      [id]
    );

    if (existingTable.length === 0) {
      return res.status(404).json({ message: "Meja tidak ditemukan." });
    }

    // Hapus meja dari database
    const [result] = await pool.query("DELETE FROM tables WHERE id_table = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      // Seharusnya tidak terjadi jika sudah lolos cek existingTable
      return res.status(500).json({ message: "Gagal menghapus meja." });
    }

    res.status(200).json({ success: true, message: "Meja berhasil dihapus!" });
  } catch (error) {
    console.error("Error deleting table:", error.message);
    // Pertimbangkan penanganan error constraint (misal, jika ada order yang terhubung ke meja ini)
    // MySQL akan memberikan error 'ER_ROW_IS_REFERENCED_2' jika ada foreign key constraint
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(409)
        .json({
          message:
            "Meja tidak bisa dihapus karena masih ada data terkait (misalnya order).",
        });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTableByNumber,
  getAllTablesCashier,
  generateQrToken,
  addTable,
  updateTable,
  getTableById,
  deleteTable, // Export fungsi baru
};
