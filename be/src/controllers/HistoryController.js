const db = require("../config/db");

class HistoryCashierController {
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
}

module.exports = HistoryCashierController;
