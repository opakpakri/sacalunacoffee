// src/controllers/PaymentsController.js
const db = require("../config/db");

class PaymentsController {
  static async markPaymentSuccess(req, res) {
    const { tableNumber, token, amountPaid } = req.body;
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [payments] = await conn.query(
        `SELECT p.id_payment, p.id_order, p.amount, p.payment_type FROM payments p
                JOIN \`tables\` t ON p.id_table = t.id_table
                WHERE p.payment_status = 'pending'
                    AND t.qr_token = ?
                    AND t.table_number = ?
                ORDER BY p.payment_time DESC
                LIMIT 1`,
        [token, tableNumber]
      );

      if (payments.length === 0) {
        throw new Error("Pembayaran tidak ditemukan atau sudah diproses.");
      }

      const { id_payment, id_order, amount, payment_type } = payments[0];

      if (payment_type === "qris") {
        if (amountPaid !== null) {
          const parsedAmountPaid = parseFloat(amountPaid);

          if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) {
            throw new Error("Nominal pembayaran tidak valid.");
          }
          if (parsedAmountPaid < amount) {
            throw new Error("Nominal yang dibayar kurang dari jumlah tagihan.");
          }
          const tolerance = 0.01;
          if (parsedAmountPaid > amount + tolerance) {
            throw new Error(
              "Nominal yang dibayar melebihi jumlah tagihan untuk pembayaran QRIS."
            );
          }
        } else {
          throw new Error(
            "Nominal pembayaran harus diinput untuk metode QRIS."
          );
        }
      }

      await conn.query(
        `UPDATE payments
                SET payment_status = 'pending', payment_time = NOW(), amount_paid = ?
                WHERE id_payment = ?`,
        [amountPaid, id_payment]
      );

      await conn.commit();
      return res.status(200).json({
        message:
          "Nominal pembayaran QRIS berhasil dicatat. Menunggu konfirmasi kasir.",
      });
    } catch (error) {
      await conn.rollback();
      console.error("Error in markPaymentSuccess transaction:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    } finally {
      if (conn) conn.release();
    }
  }

  static async cancelPaymentAndOrder(req, res) {
    const { tableNumber, token } = req.body;

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [rows] = await conn.query(
        `SELECT p.id_payment, o.id_order FROM payments p
                JOIN orders o ON p.id_order = o.id_order
                JOIN \`tables\` t ON o.id_table = t.id_table
                WHERE p.payment_status = 'pending'
                    AND t.qr_token = ?
                    AND t.table_number = ?
                ORDER BY p.payment_time DESC
                LIMIT 1`,
        [token, tableNumber]
      );

      if (rows.length === 0) {
        throw new Error("Transaksi tidak ditemukan atau sudah diproses.");
      }

      const { id_payment, id_order } = rows[0];

      await conn.query(
        `UPDATE payments SET payment_status = 'failed', payment_time = NOW() WHERE id_payment = ?`,
        [id_payment]
      );

      await conn.query(
        `UPDATE orders SET status = 'canceled' WHERE id_order = ?`,
        [id_order]
      );

      await conn.commit();
      res
        .status(200)
        .json({ message: "Pembayaran dan pesanan berhasil dibatalkan." });
    } catch (error) {
      await conn.rollback();
      console.error("Error in CancelPaymentAndOrder transaction:", error);
      res.status(400).json({ message: error.message });
    } finally {
      if (conn) conn.release();
    }
  }

  static async markExpiredPaymentsAsFailed(req, res) {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      const [expiredPayments] = await conn.query(
        `SELECT id_payment FROM payments WHERE payment_status = 'pending' AND payment_time < NOW() - INTERVAL 10 MINUTE`
      );

      if (expiredPayments.length > 0) {
        for (const payment of expiredPayments) {
          await conn.query(
            `UPDATE payments SET payment_status = 'failed', payment_time = NOW() WHERE id_payment = ?`,
            [payment.id_payment]
          );
        }
      }
      await conn.commit();
      res.status(200).json({ message: "Expired payments processed." });
    } catch (error) {
      await conn.rollback();
      console.error("Error in PaymentFailed transaction:", error);
      res
        .status(500)
        .json({ message: "Gagal mengubah status pembayaran ke failed" });
    } finally {
      if (conn) conn.release();
    }
  }

  static async getPaymentDetailsByToken(req, res) {
    const { table, token } = req.query;

    if (!table || !token) {
      return res
        .status(400)
        .json({ message: "Table number and token are required." });
    }

    try {
      const [payments] = await db.query(
        `SELECT p.id_payment, p.id_order, p.amount, p.amount_paid, p.payment_status, p.payment_type, o.table_number, o.name_customer
                FROM payments p
                JOIN orders o ON p.id_order = o.id_order
                JOIN \`tables\` t ON o.id_table = t.id_table
                WHERE t.table_number = ? AND t.qr_token = ? AND p.payment_status = 'pending'
                ORDER BY p.payment_time DESC
                LIMIT 1`,
        [table, token]
      );

      if (payments.length === 0) {
        return res.status(404).json({
          message: "No pending payment found for this table and token.",
        });
      }

      res.status(200).json(payments[0]);
    } catch (error) {
      console.error("Error fetching payment details by token:", error);
      res
        .status(500)
        .json({ message: "Server error while fetching payment details." });
    }
  }

  static async updatePaymentStatus(req, res) {
    const { id_payment } = req.params;
    const { new_status, amount_paid } = req.body;

    console.log("Received PUT request for payment ID:", id_payment);
    console.log("Request body:", { new_status, amount_paid });

    if (!id_payment || !new_status) {
      return res
        .status(400)
        .json({ message: "Payment ID and new status are required." });
    }

    const validPaymentStatuses = ["pending", "success", "failed", "processing"];
    if (!validPaymentStatuses.includes(new_status)) {
      return res
        .status(400)
        .json({ message: "Invalid payment status provided." });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [existingPayment] = await conn.query(
        `SELECT amount, payment_type, amount_paid AS current_amount_paid FROM payments WHERE id_payment = ?`,
        [id_payment]
      );

      if (existingPayment.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: "Payment not found." });
      }

      const {
        amount: original_amount,
        payment_type: existing_payment_type,
        current_amount_paid,
      } = existingPayment[0];

      let finalAmountPaid = current_amount_paid;

      if (new_status === "success") {
        if (existing_payment_type === "pay_at_cashier") {
          if (amount_paid === undefined || amount_paid === null) {
            finalAmountPaid = current_amount_paid || original_amount;
          } else {
            const parsedAmountPaid = parseFloat(amount_paid);
            if (isNaN(parsedAmountPaid) || parsedAmountPaid < original_amount) {
              throw new Error(
                "Nominal yang dibayar kurang dari jumlah tagihan untuk kasir."
              );
            }
            finalAmountPaid = parsedAmountPaid;
          }
        } else if (existing_payment_type === "qris") {
          const tolerance = 0.01;
          const parsedAmountPaid = parseFloat(amount_paid);

          if (
            isNaN(parsedAmountPaid) ||
            Math.abs(parsedAmountPaid - original_amount) > tolerance
          ) {
            throw new Error(
              "Nominal pembayaran QRIS harus sama persis dengan jumlah tagihan."
            );
          }
          finalAmountPaid = parsedAmountPaid;
        }
      } else {
        if (amount_paid !== undefined && amount_paid !== null) {
          const parsedAmountPaid = parseFloat(amount_paid);
          finalAmountPaid = isNaN(parsedAmountPaid) ? null : parsedAmountPaid;
        }
      }

      console.log("Final amount_paid to be saved:", finalAmountPaid); // Check this log
      console.log("SQL Query parameters:", [
        new_status,
        finalAmountPaid,
        id_payment,
      ]); // Check parameters

      const [result] = await conn.query(
        `UPDATE payments SET payment_status = ?, amount_paid = ?, payment_time = NOW() WHERE id_payment = ?`,
        [new_status, finalAmountPaid, id_payment]
      );

      console.log("Database UPDATE query result:", result); // Check affectedRows

      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({
          message: "Payment not found or status is already the same.",
        });
      }

      const [orderIdResult] = await conn.query(
        `SELECT id_order FROM payments WHERE id_payment = ?`,
        [id_payment]
      );
      const id_order = orderIdResult[0]?.id_order;

      if (id_order) {
        let orderStatusUpdateQuery = "";
        let orderStatusUpdateParams = [];

        if (new_status === "success") {
          orderStatusUpdateQuery = `UPDATE orders SET status = 'pending' WHERE id_order = ? AND status = 'waiting'`;
          orderStatusUpdateParams = [id_order];
        } else if (new_status === "failed") {
          orderStatusUpdateQuery = `UPDATE orders SET status = 'canceled' WHERE id_order = ? AND status != 'completed'`;
          orderStatusUpdateParams = [id_order];
        }

        if (orderStatusUpdateQuery) {
          await conn.query(orderStatusUpdateQuery, orderStatusUpdateParams);
        }
      }

      await conn.commit();
      res.status(200).json({
        message: `Payment status updated to ${new_status} successfully.`,
      });
    } catch (error) {
      await conn.rollback();
      console.error("Error updating payment status in controller:", error);
      if (error.message.includes("Nominal")) {
        return res.status(400).json({ message: error.message });
      }
      res
        .status(500)
        .json({ message: "Failed to update payment status: " + error.message });
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = PaymentsController;
