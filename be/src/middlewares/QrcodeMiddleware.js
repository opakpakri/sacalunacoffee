// middleware/validateQrToken.js
const db = require("../config/db");

const validateQrToken = async (req, res, next) => {
  const { table_number, token } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT qr_token, qr_generated_at FROM tables WHERE table_number = ?`,
      [table_number]
    );
    if (!rows.length) return res.status(400).json({ message: "Invalid table" });

    const { qr_token, qr_generated_at } = rows[0];

    if (token !== qr_token)
      return res.status(401).json({ message: "Invalid token" });

    const now = new Date();
    const generatedAt = new Date(qr_generated_at);
    const diffMinutes = (now - generatedAt) / 1000;

    if (diffMinutes > 1200)
      return res.status(401).json({ message: "Token expired" });

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error validating token" });
  }
};

module.exports = validateQrToken;
