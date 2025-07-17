// src/controllers/TransactionKitchenController.js
const db = require("../config/db");

class TransactionKitchenController {
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
                t.table_number,
                o.status AS order_status,
                o.order_time
            FROM
                orders o
            JOIN
                tables t ON o.id_table = t.id_table
            WHERE
                DATE(o.order_time) = ?
        `;
    let params = [todayFormatted];

    const searchConditions = [];
    const searchParams = [];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;

      searchConditions.push(
        `o.name_customer LIKE ?`,
        `t.table_number LIKE ?`,
        `o.status LIKE ?`
      );
      searchParams.push(searchPattern, searchPattern, searchPattern);

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
        "Error fetching today's transactions for kitchen:",
        error.message
      );
      res
        .status(500)
        .json({ message: "Server error while fetching kitchen transactions." });
    }
  }

  static async getOrderItemsByOrderId(req, res) {
    const { id_order } = req.params;

    if (!id_order) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    try {
      const [items] = await db.query(
        `SELECT
                    oi.id_order_item,
                    oi.id_order,
                    oi.id_menu,
                    oi.quantity,
                    oi.price,
                    m.name_menu AS menu_name
                 FROM
                    order_items oi
                 JOIN
                    menus m ON oi.id_menu = m.id_menu
                 WHERE
                    oi.id_order = ?`,
        [id_order]
      );

      if (items.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching order items for kitchen:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch order items. " + error.message });
    }
  }

  static async updateOrderStatus(req, res) {
    const { id_order } = req.params;
    const { new_status } = req.body;

    if (!id_order || !new_status) {
      return res
        .status(400)
        .json({ message: "Order ID and new status are required." });
    }

    // Tambahkan 'waiting' ke daftar status valid
    const validOrderStatuses = [
      "waiting", // Status baru
      "pending",
      "processing",
      "completed",
      "canceled",
    ];

    if (!validOrderStatuses.includes(new_status)) {
      return res.status(400).json({
        message: `Invalid order status provided: '${new_status}'. Valid statuses are: ${validOrderStatuses.join(
          ", "
        )}`,
      });
    }

    try {
      const [result] = await db.query(
        `UPDATE orders SET status = ? WHERE id_order = ?`,
        [new_status, id_order]
      );

      if (result.affectedRows === 0) {
        const [existingOrder] = await db.query(
          `SELECT status FROM orders WHERE id_order = ?`,
          [id_order]
        );
        if (
          existingOrder.length > 0 &&
          existingOrder[0].status === new_status
        ) {
          return res.status(200).json({
            message: `Order status is already ${new_status}. No update needed.`,
          });
        }
        return res.status(404).json({ message: "Order not found." });
      }

      res.status(200).json({
        message: `Order status updated to ${new_status} successfully.`,
      });
    } catch (error) {
      console.error("Error updating kitchen order status:", error);
      res
        .status(500)
        .json({ message: "Failed to update order status. " + error.message });
    }
  }
}

module.exports = TransactionKitchenController;
