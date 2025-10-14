const db = require("../config/db");

function getJakartaDateTime() {
  const now = new Date();
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  };
  const jakartaTimeString = new Intl.DateTimeFormat("en-CA", options).format(
    now
  );
  return jakartaTimeString.replace(
    /(\d{4})-(\d{2})-(\d{2}),? (\d{2}):(\d{2}):(\d{2})/,
    "$1-$2-$3 $4:$5:$6"
  );
}

exports.checkout = async (req, res) => {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const {
      name_customer,
      phone,
      table_number,
      payment_method,
      payment_type,
      items,
      amount,
    } = req.body;

    const trimmedPhone = phone?.trim();

    let phoneToSave = null;
    if (!trimmedPhone) {
      phoneToSave = null;
    } else {
      if (!/^\d{10,13}$/.test(trimmedPhone)) {
        await conn.rollback();
        return res.status(400).json({
          error: "Nomor telepon harus terdiri dari 10 sampai 13 digit angka",
        });
      }
      phoneToSave = trimmedPhone;
    }

    const [tableRows] = await conn.query(
      `SELECT id_table FROM tables WHERE table_number = ?`,
      [table_number]
    );

    if (tableRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: "Nomor meja tidak valid" });
    }

    const id_table = tableRows[0].id_table;

    const currentOrderTime = getJakartaDateTime();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (id_table, name_customer, phone, table_number, payment_method, status, order_time)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_table,
        name_customer,
        phoneToSave,
        table_number,
        payment_method || "pay_at_cashier",
        "waiting",
        currentOrderTime,
      ]
    );

    const id_order = orderResult.insertId;

    for (const item of items) {
      if (!item.id_menu || !item.quantity || !item.price) {
        await conn.rollback();
        return res
          .status(400)
          .json({ error: "Data item pesanan tidak lengkap" });
      }

      const [menuRows] = await conn.query(
        `SELECT stock FROM menus WHERE id_menu = ?`,
        [item.id_menu]
      );

      if (menuRows.length === 0 || menuRows[0].stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          error: `Stok untuk menu dengan ID ${item.id_menu} tidak mencukupi.`,
        });
      }

      // 🔹 Kurangi stok sekarang saat pesanan dibuat
      await conn.query(`UPDATE menus SET stock = stock - ? WHERE id_menu = ?`, [
        item.quantity,
        item.id_menu,
      ]);

      await conn.query(
        `INSERT INTO order_items (id_order, id_menu, quantity, price)
                 VALUES (?, ?, ?, ?)`,
        [id_order, item.id_menu, item.quantity, item.price]
      );
    }

    const currentPaymentTime = getJakartaDateTime();

    let initial_amount_paid = null;
    if (payment_type === "cashier") {
      initial_amount_paid = null; // Tetap null jika bayar di kasir
    } else {
      initial_amount_paid = null; // Tetap null jika online tapi pembayaran belum dikonfirmasi
    }

    await conn.query(
      `INSERT INTO payments (id_order, id_table, amount, amount_paid, payment_status, payment_type, payment_time)
               VALUES (?, ?, ?, ?, ?, ?, ?)`, // Hapus NOW() di sini
      [
        id_order,
        id_table,
        amount,
        initial_amount_paid,
        "pending", // Status awal selalu pending
        payment_type || "cashier",
        currentPaymentTime, // Gunakan waktu Jakarta di sini
      ]
    );

    await conn.commit();
    res.status(201).json({ success: true, id_order });
  } catch (err) {
    await conn.rollback();
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Gagal menyimpan pesanan" });
  } finally {
    conn.release();
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id_order } = req.params;
  const { new_status } = req.body;

  if (!id_order || !new_status) {
    return res
      .status(400)
      .json({ message: "Order ID and new status are required." });
  }

  const validOrderStatuses = [
    "waiting",
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
      if (existingOrder.length > 0 && existingOrder[0].status === new_status) {
        return res.status(200).json({
          message: `Order status is already ${new_status}. No update needed.`,
        });
      }
      return res.status(404).json({ message: "Order not found." });
    }

    res
      .status(200)
      .json({ message: `Order status updated to ${new_status} successfully.` });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status." });
  }
};
