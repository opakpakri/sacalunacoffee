const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");

const getAllMenus = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM menus");
    res
      .status(200)
      .json({ message: "Menus retrieved successfully", data: results });
  } catch (err) {
    console.error("Error fetching menus:", err.message);
    res.status(500).json({ message: "Failed to retrieve Menus" });
  }
};

const addMenu = async (req, res) => {
  try {
    const { name_menu, price, category } = req.body;
    const imageUrl = req.file?.path;

    if (!name_menu || !price || !category || !imageUrl) {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res
        .status(400)
        .json({ message: "Semua field harus diisi, termasuk gambar" });
    }
    const query = `INSERT INTO menus (name_menu, price, category_menu, image_menu) VALUES (?, ?, ?, ?)`;
    await pool.query(query, [name_menu, price, category, imageUrl]);

    res
      .status(201)
      .json({ message: "Menu added successfully", imageUrl: imageUrl });
  } catch (err) {
    console.error("Error adding menu:", err.message);
    if (req.file && req.file.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id);
        console.log(
          "Gambar yang gagal disimpan ke DB dihapus dari Cloudinary."
        );
      } catch (destroyErr) {
        console.error(
          "Gagal menghapus gambar dari Cloudinary setelah error DB:",
          destroyErr.message
        );
      }
    }
    res.status(500).json({ message: err.message || "Failed to add menu" });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_menu, price, category } = req.body;
    const newImageUrl = req.file?.path;

    const [rows] = await pool.query(
      "SELECT image_menu FROM menus WHERE id_menu = ?",
      [id]
    );

    if (rows.length === 0) {
      if (newImageUrl && req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(404).json({ message: "Menu not found" });
    }

    const oldImageUrl = rows[0].image_menu;

    if (newImageUrl && oldImageUrl) {
      try {
        const publicIdMatch = oldImageUrl.match(
          /\/upload\/(?:v\d+\/)?(.+)\.\w+$/
        );
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1];
          await cloudinary.uploader.destroy(publicId);
          console.log(
            `Gambar lama berhasil dihapus dari Cloudinary: ${publicId}`
          );
        } else {
          console.warn(
            `Tidak dapat mengekstrak public_id dari URL lama: ${oldImageUrl}`
          );
        }
      } catch (deleteErr) {
        console.error(
          "Error deleting old image from Cloudinary:",
          deleteErr.message
        );
      }
    }

    const imageUrlToSave = newImageUrl || oldImageUrl;

    await pool.query(
      `UPDATE menus SET name_menu = ?, price = ?, category_menu = ?, image_menu = ? WHERE id_menu = ?`,
      [name_menu, price, category, imageUrlToSave, id]
    );

    res
      .status(200)
      .json({ message: "Menu updated successfully", imageUrl: imageUrlToSave });
  } catch (err) {
    console.error("Error updating menu:", err.message);
    res.status(500).json({ message: err.message || "Failed to update menu" });
  }
};

const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM menus WHERE id_menu = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching menu by id:", error.message);
    res.status(500).json({ message: "Failed to retrieve menu" });
  }
};

const deleteMenu = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT image_menu FROM menus WHERE id_menu = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    const imageUrlToDelete = rows[0].image_menu;

    if (imageUrlToDelete) {
      try {
        const publicIdMatch = imageUrlToDelete.match(
          /\/upload\/(?:v\d+\/)?(.+)\.\w+$/
        );
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1];
          await cloudinary.uploader.destroy(publicId);
          console.log(`Gambar berhasil dihapus dari Cloudinary: ${publicId}`);
        } else {
          console.warn(
            `Tidak dapat mengekstrak public_id dari URL: ${imageUrlToDelete}`
          );
        }
      } catch (deleteErr) {
        console.error(
          "Error deleting image from Cloudinary:",
          deleteErr.message
        );
      }
    }

    await pool.query("DELETE FROM menus WHERE id_menu = ?", [id]);
    res.json({ message: "Menu berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting menu:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateMenuStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock)) {
      return res.status(400).json({ message: "Invalid stock value" });
    }

    const [rows] = await pool.query("SELECT * FROM menus WHERE id_menu = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    await pool.query("UPDATE menus SET stock = ? WHERE id_menu = ?", [
      stock,
      id,
    ]);

    res.status(200).json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error.message);
    res.status(500).json({ message: "Failed to update stock" });
  }
};

module.exports = {
  getAllMenus,
  addMenu,
  updateMenu,
  getMenuById,
  deleteMenu,
  updateMenuStock,
};
