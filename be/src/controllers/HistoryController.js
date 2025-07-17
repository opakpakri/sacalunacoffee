const db = require("../config/db");

class HistoryController {
  static async getAllTransactions(req, res) {
    const { searchTerm, month, year } = req.query;

    let query = `
            SELECT
                o.id_order,
                o.id_table,
                o.name_customer,
                o.phone,
                o.table_number,
                p.amount AS order_amount,
                o.payment_method,
                p.payment_status,
                p.payment_type,
                p.payment_time,
                o.status AS order_status,
                o.order_time
            FROM
                orders o
            LEFT JOIN
                payments p ON o.id_order = p.id_order
        `;
    let params = [];
    const conditions = [];

    if (month && year) {
      conditions.push(`MONTH(o.order_time) = ?`);
      params.push(parseInt(month));
      conditions.push(`YEAR(o.order_time) = ?`);
      params.push(parseInt(year));
    } else if (month) {
      conditions.push(`MONTH(o.order_time) = ?`);
      params.push(parseInt(month));
    }

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      const searchSubConditions = [
        `o.name_customer LIKE ?`,
        `o.table_number LIKE ?`,
        `p.payment_type LIKE ?`,
        `p.payment_status LIKE ?`,
        `o.status LIKE ?`,
      ];
      const searchSubParams = [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      ];

      const searchId = parseInt(searchTerm);
      if (!isNaN(searchId)) {
        searchSubConditions.push(`o.id_order = ?`);
        searchSubParams.push(searchId);
      }

      if (searchSubConditions.length > 0) {
        conditions.push(`(${searchSubConditions.join(" OR ")})`);
        params = [...params, ...searchSubParams];
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY o.order_time DESC`;

    try {
      const [rows] = await db.query(query, params);
      res.status(200).json(rows);
    } catch (error) {
      console.error(
        "Error fetching all transactions for cashier history:",
        error.message
      );
      res.status(500).json({
        message: "Server error while fetching cashier history transactions.",
      });
    }
  }

  // --- FUNGSI BARU: Mendapatkan item pesanan berdasarkan ID Order ---
  static async getOrderItemsByOrderId(req, res) {
    const { id_order } = req.params;

    if (!id_order) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    try {
      const [items] = await db.query(
        `
        SELECT
            oi.id_order_item,
            oi.id_order,
            oi.id_menu,
            oi.quantity,
            oi.price,
            COALESCE(m.name_menu, 'Menu Dihapus') AS menu_name, -- Gunakan COALESCE
            m.image_menu -- Jika Anda perlu data gambar menu
        FROM
            order_items oi
        LEFT JOIN -- Penting: Gunakan LEFT JOIN untuk tetap menyertakan order_items dengan id_menu NULL
            menus m ON oi.id_menu = m.id_menu
        WHERE
            oi.id_order = ?
        ORDER BY oi.id_order_item ASC
        `,
        [id_order]
      );

      // Kalau tidak ada item untuk order ID tersebut, kirim respons 200 dengan array kosong
      if (items.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching order items by Order ID:", error.message);
      res.status(500).json({ message: "Failed to retrieve order items." });
    }
  }
  // --- AKHIR FUNGSI BARU ---
}

module.exports = HistoryController;
