const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET; // Pastikan ini SAMA PERSIS dengan di AuthController.js

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message:
        "Token autentikasi tidak tersedia atau format tidak benar. Mohon login.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // Menyimpan payload token di req.user
    next(); // Lanjutkan ke handler route berikutnya
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Sesi Anda telah berakhir. Mohon login kembali.",
        expired: true,
      });
    } else if (error.name === "JsonWebTokenError") {
      return res
        .status(403)
        .json({ message: "Token tidak valid. Akses ditolak." });
    } else {
      console.error("Kesalahan autentikasi:", error);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan server saat autentikasi." });
    }
  }
};

module.exports = authenticate;
