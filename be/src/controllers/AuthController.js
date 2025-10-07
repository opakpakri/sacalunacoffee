// controllers/AuthController.js
require("dotenv").config();
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET; // Pastikan ini SAMA PERSIS dengan di authmiddleware.js
const SECRET_KEY = process.env.SECRET_KEY;

const login = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE BINARY name_user = ? AND BINARY role = ?",
      [username, role]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Username atau role salah!" });
    }

    const user = rows[0];

    // Dekripsi password dari frontend
    const bytes = CryptoJS.AES.decrypt(password, SECRET_KEY);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

    // Bandingkan hash
    const isMatch = await bcrypt.compare(decryptedPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Password salah!" });
    }

    // Generate token dengan expiresIn yang ditentukan
    const token = jwt.sign(
      { id_user: user.id_user, role: user.role, name_user: user.name_user },
      JWT_SECRET,
      { expiresIn: "1d" } // <-- UBAH KE "1m" UNTUK TESTING
    );

    return res.status(200).json({
      message: "Login berhasil",
      user: {
        id_user: user.id_user,
        name_user: user.name_user,
        role: user.role,
        token, // Kirim token ke frontend
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

module.exports = { login };
