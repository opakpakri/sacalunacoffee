const fs = require("fs");
const pool = require("../config/db");
const path = require("path");

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
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({
          message:
            "Image is required or invalid type (only .png or .webp allowed)",
        });
    }

    const imagePath = `/uploads/menus/${file.filename}`;
    const query = `INSERT INTO menus (name_menu, price, category_menu, image_menu) VALUES (?, ?, ?, ?)`;
    await pool.query(query, [name_menu, price, category, imagePath]);

    res.status(201).json({ message: "Menu added successfully" });
  } catch (err) {
    console.error("Error adding menu:", err.message);
    res.status(500).json({ message: err.message || "Failed to add menu" });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_menu, price, category } = req.body;

    const [rows] = await pool.query(
      "SELECT image_menu FROM menus WHERE id_menu = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    let imagePath = null;
    const oldImage = rows[0].image_menu;

    if (req.file) {
      imagePath = `/uploads/menus/${req.file.filename}`;

      if (oldImage) {
        const oldImagePath = path.join(__dirname, "..", oldImage);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err.message);
          else console.log("Old image deleted:", oldImagePath);
        });
      }
    }

    await pool.query(
      `UPDATE menus SET name_menu = ?, price = ?, category_menu = ?, image_menu = COALESCE(?, image_menu) WHERE id_menu = ?`,
      [name_menu, price, category, imagePath, id]
    );

    res.status(200).json({ message: "Menu updated successfully" });
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

    const imagePath = rows[0].image_menu;
    if (imagePath) {
      const fullPath = path.join(__dirname, "..", imagePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Error deleting image:", err.message);
        else console.log("Image deleted:", fullPath);
      });
    }

    await pool.query("DELETE FROM menus WHERE id_menu = ?", [id]);
    res.json({ message: "Menu berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting menu:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllMenus,
  addMenu,
  updateMenu,
  getMenuById,
  deleteMenu,
};
