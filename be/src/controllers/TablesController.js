const fs = require("fs");
const pool = require("../config/db");
const path = require("path");
const crypto = require("crypto");

function getJakartaDateTime() {
  const now = new Date();
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  };
  const jakartaTimeString = new Intl.DateTimeFormat("en-CA", options).format(
    now
  );
  return jakartaTimeString.replace(
    /(\d{4})-(\d{2})-(\d{2}),? (\d{2}):(\d{2}):(\d{2})/,
    "$1-$2-$3 $4:$5:$6"
  );
}

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

  const nowInJakarta = getJakartaDateTime();

  try {
    const [rows] = await pool.query(
      "SELECT table_number, qr_token, qr_generated_at FROM tables WHERE id_table = ?",
      [id_table]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Table not found" });
    }

    const { qr_token, qr_generated_at, table_number } = rows[0];

    if (!force && qr_token && qr_generated_at) {
      const generatedAt = new Date(qr_generated_at);
      const nowAsDate = new Date(nowInJakarta);
      const diffSeconds = (nowAsDate - generatedAt) / 1000;
      if (diffSeconds < 600) {
        return res.json({
          success: true,
          qr_token,
          qr_generated_at,
          reused: true,
        });
      }
    }

    const token = crypto.randomBytes(16).toString("hex");

    await pool.query(
      "UPDATE tables SET qr_token = ?, qr_generated_at = ? WHERE id_table = ?",
      [token, nowInJakarta, id_table]
    );

    res.json({
      success: true,
      qr_token: token,
      qr_generated_at: nowInJakarta,
      reused: false,
    });
  } catch (error) {
    console.error("generateQrToken error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addTable = async (req, res) => {
  const { table_number } = req.body;

  if (!table_number) {
    return res.status(400).json({ message: "Nomor meja harus diisi." });
  }

  try {
    const [existingTable] = await pool.query(
      "SELECT id_table FROM tables WHERE table_number = ?",
      [table_number]
    );

    if (existingTable.length > 0) {
      return res.status(409).json({ message: "Nomor meja sudah ada." });
    }

    const [result] = await pool.query(
      "INSERT INTO tables (table_number, qr_token, qr_generated_at) VALUES (?, ?, ?)",
      [table_number, "", null]
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
  const { id } = req.params;
  const { table_number } = req.body;

  if (!table_number) {
    return res.status(400).json({ message: "Nomor meja tidak boleh kosong." });
  }

  try {
    const [existingTable] = await pool.query(
      "SELECT id_table FROM tables WHERE table_number = ? AND id_table != ?",
      [table_number, id]
    );

    if (existingTable.length > 0) {
      return res
        .status(409)
        .json({ message: "Nomor meja sudah ada untuk meja lain." });
    }

    const [result] = await pool.query(
      "UPDATE tables SET table_number = ? WHERE id_table = ?",
      [table_number, id]
    );

    if (result.affectedRows === 0) {
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
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM tables WHERE id_table = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Table not found." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching table by ID:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const deleteTable = async (req, res) => {
  const { id } = req.params;

  try {
    const [existingTable] = await pool.query(
      "SELECT id_table FROM tables WHERE id_table = ?",
      [id]
    );

    if (existingTable.length === 0) {
      return res.status(404).json({ message: "Meja tidak ditemukan." });
    }

    const [result] = await pool.query("DELETE FROM tables WHERE id_table = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Gagal menghapus meja." });
    }

    res.status(200).json({ success: true, message: "Meja berhasil dihapus!" });
  } catch (error) {
    console.error("Error deleting table:", error.message);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
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
  deleteTable,
};
