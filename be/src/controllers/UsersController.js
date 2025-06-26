require("dotenv").config();
const pool = require("../config/db");
const CryptoJS = require("crypto-js");
const bcrypt = require("bcrypt");

const SECRET_KEY = process.env.SECRET_KEY;
console.log(SECRET_KEY); // sacaluna_secret_key

// Ambil semua user
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT * FROM users");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Tambah user baru
const addUser = async (req, res) => {
  const { name_user, email, password, role } = req.body;

  if (!name_user || !email || !password || !role) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  try {
    // 1. Cek apakah email sudah terdaftar
    const [existingUsers] = await pool.query(
      "SELECT id_user FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      // Jika email sudah ada, kirim respons error
      return res.status(409).json({ message: "Email sudah terdaftar" }); // 409 Conflict
    }

    // 2. Jika email belum terdaftar, lanjutkan proses penambahan user
    // 🔓 Dekripsi password
    const bytes = CryptoJS.AES.decrypt(password, SECRET_KEY);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

    // 🔑 Hash password dengan bcrypt
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);

    // 🧠 Simpan ke database
    const insertQuery = `
      INSERT INTO users (name_user, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    await pool.query(insertQuery, [name_user, email, hashedPassword, role]);
    res.status(201).json({ message: "User berhasil ditambahkan" });
  } catch (err) {
    console.error("Error adding user:", err);
    // Jika ada error lain (misal dari database), kirim Server error
    res.status(500).json({ message: "Server error" });
  }
};

// Ambil user berdasarkan ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id_user = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error get user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit user (tanpa ubah password)
const updateUserNoPassword = async (req, res) => {
  const { id } = req.params;
  const { name_user, email, role } = req.body;

  try {
    // Tambahkan pengecekan email di sini juga jika email bisa diubah
    // dan Anda tidak ingin user mengubahnya menjadi email yang sudah ada
    const [existingUsers] = await pool.query(
      "SELECT id_user FROM users WHERE email = ? AND id_user <> ?",
      [email, id]
    );

    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "Email sudah terdaftar untuk pengguna lain." });
    }

    const updateQuery = `
      UPDATE users SET name_user = ?, email = ?, role = ?
      WHERE id_user = ?
    `;
    await pool.query(updateQuery, [name_user, email, role, id]);
    res.json({ message: "User berhasil diperbarui" });
  } catch (err) {
    console.error("Error updating user (no password change):", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserWithPassword = async (req, res) => {
  const { id } = req.params;
  const { name_user, email, password, role } = req.body;

  if (!name_user || !email || !password || !role) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  try {
    // Tambahkan pengecekan email di sini juga
    const [existingUsers] = await pool.query(
      "SELECT id_user FROM users WHERE email = ? AND id_user <> ?",
      [email, id]
    );

    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "Email sudah terdaftar untuk pengguna lain." });
    }

    // 🔓 Dekripsi password
    const bytes = CryptoJS.AES.decrypt(password, SECRET_KEY);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

    // 🔑 Hash password dengan bcrypt
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);

    // 🧠 Simpan ke database
    const updateQuery = `
      UPDATE users SET name_user = ?, email = ?, password = ?, role = ?
      WHERE id_user = ?
    `;
    await pool.query(updateQuery, [name_user, email, hashedPassword, role, id]);
    res.json({ message: "User berhasil diperbarui" });
  } catch (err) {
    console.error("Error updating user (with password change):", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const { password } = req.body;

  // Cek apakah password kosong atau hanya spasi (trim() untuk menghapus spasi di awal/akhir)
  if (password && password.trim() !== "") {
    return updateUserWithPassword(req, res);
  } else {
    return updateUserNoPassword(req, res);
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id_user = ?", [id]);
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  addUser,
  getUserById,
  updateUser,
  deleteUser,
};
