// src/app.js

// Memuat variabel lingkungan dari file .env
require("dotenv").config();

// Mengimpor modul yang diperlukan
const express = require("express");
const cors = require("cors");
const path = require("path");

// Inisialisasi aplikasi Express
const app = express();

// Mengatur port server dari variabel lingkungan atau default ke 3000
const PORT = process.env.PORT || 3000;
// Mengatur kunci rahasia dari variabel lingkungan atau default
const SECRET_KEY = process.env.SECRET_KEY || "default_secret";
console.log("SECRET_KEY:", SECRET_KEY); // Mencetak kunci rahasia (untuk debugging, jangan di log di produksi)

// Middleware untuk parsing body permintaan
app.use(express.json()); // Mengizinkan aplikasi untuk membaca JSON dari body permintaan
app.use(express.urlencoded({ extended: true })); // Mengizinkan aplikasi untuk membaca URL-encoded data dari body permintaan

// Daftar origin (domain) yang diizinkan untuk mengakses API ini
// Ini penting untuk keamanan CORS (Cross-Origin Resource Sharing)
const allowedOrigins = [
  "https://sacalunacoffee-admin.vercel.app", // Frontend admin di Vercel
  "https://sacalunacoffee-menu.vercel.app", // Frontend menu di Vercel (jika ini juga mengakses API)
  "https://sacalunacoffee.vercel.app", // Frontend utama di Vercel
  "http://localhost:3000", // Untuk pengembangan lokal backend
  "http://localhost:5173", // Untuk pengembangan lokal frontend (misal: dengan Vite)
];

// Konfigurasi middleware CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Izinkan permintaan jika tidak ada origin (misalnya, dari Postman atau aplikasi seluler)
      // atau jika origin yang meminta ada dalam daftar allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Izinkan akses
      } else {
        console.error("Blocked by CORS:", origin); // Log origin yang diblokir
        callback(new Error("Not allowed by CORS")); // Tolak akses dengan pesan error
      }
    },
    credentials: true, // Penting: Mengizinkan pengiriman cookie atau header otorisasi (misalnya, token JWT)
  })
);

// Middleware untuk menyajikan file statis (misalnya, gambar yang diunggah)
// Pastikan folder 'uploads' ada di direktori yang sama dengan 'src' atau sesuaikan path
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mengimpor modul rute API
const menusRoutes = require("./routes/MenusRoutes");
const authRoutes = require("./routes/AuthRoutes");
const usersRoutes = require("./routes/UsersRoutes");
const blogsRoutes = require("./routes/BlogsRoutes");
const tablesRoutes = require("./routes/TablesRoutes");
const ordersRoutes = require("./routes/OrdersRoutes");
const PaymentsRoutes = require("./routes/PaymentsRoutes");
const TransactionCashierRoutes = require("./routes/TransactionCashierRoutes");
const TransactionKitchenRoutes = require("./routes/TransactionKitchenRoutes");
const HistoryRoutes = require("./routes/HistoryRoutes");
const authenticate = require("./middlewares/AuthMiddlewares"); // Middleware otentikasi

// Mendefinisikan rute-rute API
app.use("/api/login", authRoutes);
app.use("/api/menus", menusRoutes);
app.use("/api/users", authenticate, usersRoutes); // Rute yang dilindungi otentikasi
app.use("/api/blogs", blogsRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", PaymentsRoutes);
app.use("/api/transactions-cashier", authenticate, TransactionCashierRoutes); // Rute yang dilindungi otentikasi
app.use("/api/transactions-kitchen", authenticate, TransactionKitchenRoutes); // Rute yang dilindungi otentikasi
app.use("/api/historys-admin", authenticate, HistoryRoutes); // Rute yang dilindungi otentikasi

// Rute utama (root route) untuk memeriksa apakah API berjalan
app.get("/", (req, res) => {
  res.send("API is running");
});

// Handler 404 (Not Found) untuk rute yang tidak didefinisikan
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint Not Found" });
});

// Memulai server dan mendengarkan pada port yang ditentukan
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Mengekspor objek 'app' agar dapat digunakan di file lain (misalnya, server.js)
module.exports = app;
