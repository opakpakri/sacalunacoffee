require("dotenv").config(); // Memuat variabel lingkungan dari file .env
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "default_secret";
console.log("SECRET_KEY:", SECRET_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Daftar origin yang diizinkan untuk CORS
const allowedOrigins = [
  "https://sacalunacoffee-admin.vercel.app",
  "https://sacalunacoffee-menu.vercel.app",
  "https://sacalunacoffee.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import Routes
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
const authenticate = require("./middlewares/AuthMiddlewares");

// Routes
app.use("/api/login", authRoutes);
app.use("/api/menus", menusRoutes);
app.use("/api/users", authenticate, usersRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", PaymentsRoutes);
app.use("/api/transactions-cashier", authenticate, TransactionCashierRoutes);
app.use("/api/transactions-kitchen", authenticate, TransactionKitchenRoutes);
app.use("/api/historys-admin", authenticate, HistoryRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("API is running");
});

// 404 handler (untuk rute yang tidak ditemukan)
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint Not Found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
