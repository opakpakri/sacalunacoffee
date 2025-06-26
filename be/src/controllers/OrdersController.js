const db = require("../config/db");

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
      order_time,
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

    // Insert into orders - Default status is 'waiting'
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
        order_time,
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

      await conn.query(
        `INSERT INTO order_items (id_order, id_menu, quantity, price)
                 VALUES (?, ?, ?, ?)`,
        [id_order, item.id_menu, item.quantity, item.price]
      );
    }

    const payment_time = new Date().toISOString();

    // Determine initial amount_paid based on payment_type
    let initial_amount_paid = null;
    if (payment_type === "cashier") {
      // For cashier payments, amount_paid is the total amount (assuming full payment at cashier)
      // Or you might want to keep it NULL if the cashier will input it later.
      // Given your request "set menjadi null bila menggunakan metode kasir", we set it to null here.
      initial_amount_paid = null;
    } else {
      // For QRIS or other online methods, amount_paid is initially null and updated later
      initial_amount_paid = null;
    }

    await conn.query(
      `INSERT INTO payments (id_order, id_table, amount, amount_paid, payment_status, payment_type, payment_time)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_order,
        id_table,
        amount,
        initial_amount_paid, // Insert the initial amount_paid here
        "pending", // Payment status remains pending at checkout
        payment_type || "cashier",
        payment_time,
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

// ... (existing updateOrderStatus function)
exports.updateOrderStatus = async (req, res) => {
  const { id_order } = req.params;
  const { new_status } = req.body;

  if (!id_order || !new_status) {
    return res
      .status(400)
      .json({ message: "Order ID and new status are required." });
  }

  const validOrderStatuses = [
    "waiting", // Pastikan 'waiting' ada di sini
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
