const fs = require("fs");
const pool = require("../config/db");
const path = require("path");

const getAllBlogs = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM blogs");
    res
      .status(200)
      .json({ message: "Blogs retrieved successfully", data: results });
  } catch (err) {
    console.error("Error fetching Blogs:", err.message);
    res.status(500).json({ message: "Failed to retrieve Blogs" });
  }
};

const addBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file?.filename;

    if (!title || !content || !image) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    const imagePath = `/uploads/${image}`;
    await pool.query(
      "INSERT INTO blogs (title, content, image_blog) VALUES (?, ?, ?)",
      [title, content, imagePath]
    );

    res.status(201).json({ message: "Blog berhasil ditambahkan" });
  } catch (err) {
    console.error("Error adding blog:", err.message);
    res.status(500).json({ message: "Gagal menambahkan blog" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const newImage = req.file?.filename;

    const [oldData] = await pool.query(
      "SELECT * FROM blogs WHERE id_blog = ?",
      [id]
    );
    if (oldData.length === 0) {
      return res.status(404).json({ message: "Blog tidak ditemukan" });
    }

    if (newImage && oldData[0].image_blog) {
      const oldImagePath = path.join(__dirname, "..", oldData[0].image_blog);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const imagePath = newImage ? `/uploads/${newImage}` : null;
    await pool.query(
      `
      UPDATE blogs 
      SET title = ?, content = ?, image_blog = COALESCE(?, image_blog) 
      WHERE id_blog = ?`,
      [title, content, imagePath, id]
    );

    res.status(200).json({ message: "Blog berhasil diupdate" });
  } catch (err) {
    console.error("Error updating blog:", err.message);
    res.status(500).json({ message: "Gagal mengupdate blog" });
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM blogs WHERE id_blog = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Blog tidak ditemukan" });
    }

    res.status(200).json({ data: rows[0] });
  } catch (err) {
    console.error("Error fetching blog by ID:", err.message);
    res.status(500).json({ message: "Gagal mengambil blog" });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT image_blog FROM blogs WHERE id_blog = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const imagePath = rows[0].image_blog;
    if (imagePath) {
      const fullPath = path.join(__dirname, "..", imagePath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error("Error deleting image:", err.message);
        else console.log("Image deleted:", fullPath);
      });
    }

    await pool.query("DELETE FROM blogs WHERE id_blog = ?", [id]);
    res.json({ message: "Blog berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllBlogs,
  addBlog,
  updateBlog,
  getBlogById,
  deleteBlog,
};
