// src/controllers/TransactionCashierController.js
const db = require("../config/db");

class TransactionCashierController {
  static async getTodayTransactions(req, res) {
    const { searchTerm } = req.query;
    const today = new Date();
    const todayFormatted = today.toISOString().slice(0, 10);

    let query = `
            SELECT
                o.id_order,
                o.id_table,
                o.name_customer,
                o.phone,
                o.table_number,
                p.amount AS order_amount,
                p.amount_paid,
                o.payment_method,
                o.status AS order_status,
                o.order_time,
                p.id_payment,
                p.amount AS payment_amount,
                p.payment_status,
                p.payment_type,
                p.payment_time
            FROM
                orders o
            LEFT JOIN
                payments p ON o.id_order = p.id_order
            WHERE
                DATE(o.order_time) = ?
        `;
    let params = [todayFormatted];

    const searchConditions = [];
    const searchParams = [];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      searchConditions.push(
        `LOWER(o.name_customer) LIKE LOWER(?)`,
        `o.table_number LIKE ?`,
        `LOWER(p.payment_type) LIKE LOWER(?)`,
        `LOWER(p.payment_status) LIKE LOWER(?)`,
        `LOWER(o.status) LIKE LOWER(?)`
      );
      searchParams.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );

      const searchId = parseInt(searchTerm);
      if (!isNaN(searchId)) {
        searchConditions.push(`o.id_order = ?`);
        searchParams.push(searchId);
      }

      if (searchConditions.length > 0) {
        query += ` AND (${searchConditions.join(" OR ")})`;
        params = [...params, ...searchParams];
      }
    }

    query += ` ORDER BY o.order_time DESC`;

    try {
      const [rows] = await db.query(query, params);
      res.status(200).json(rows);
    } catch (error) {
      console.error(
        "Error fetching today's transactions for cashier:",
        error.message
      );
      res
        .status(500)
        .json({ message: "Server error while fetching cashier transactions." });
    }
  }

  static async getOrderItemsByOrderId(req, res) {
    const { id_order } = req.params;
    if (!id_order) {
      return res.status(400).json({ message: "Order ID is required." });
    }
    try {
      const [items] = await db.query(
        `SELECT oi.id_order_item, oi.id_order, oi.id_menu, oi.quantity, oi.price, m.name_menu AS menu_name
                FROM order_items oi
                JOIN menus m ON oi.id_menu = m.id_menu
                WHERE oi.id_order = ?`,
        [id_order]
      );

      if (items.length === 0) {
        return res
          .status(404)
          .json({ message: "No items found for this order ID." });
      }
      res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res
        .status(500)
        .json({
          message:
            "Failed to fetch order items from database. " + error.message,
        });
    }
  }
}

module.exports = TransactionCashierController;
