// src/controllers/BlogsController.js (Pastikan ini yang Anda gunakan)
const pool = require("../config/db");
const cloudinary = require("../config/cloudinary"); // Impor instance Cloudinary yang sudah dikonfigurasi

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
    const imageUrl = req.file?.path; // Dapatkan URL gambar dari Cloudinary

    if (!title || !content || !imageUrl) {
      // Pastikan imageUrl ada
      // Jika ada file yang terupload ke Cloudinary tapi ada validasi gagal, hapus gambar tersebut.
      // public_id disimpan di req.file.filename atau req.file.public_id
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res
        .status(400)
        .json({ message: "Semua field harus diisi, termasuk gambar" });
    }

    await pool.query(
      "INSERT INTO blogs (title, content, image_blog) VALUES (?, ?, ?)",
      [title, content, imageUrl] // Simpan URL Cloudinary ke database
    );

    res
      .status(201)
      .json({ message: "Blog berhasil ditambahkan", imageUrl: imageUrl });
  } catch (err) {
    console.error("Error adding blog:", err.message);
    // Jika ada file yang terupload ke Cloudinary sebelum error DB, hapus juga
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
    res.status(500).json({ message: "Gagal menambahkan blog" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const newImageUrl = req.file?.path; // Dapatkan URL gambar baru dari Cloudinary

    const [oldData] = await pool.query(
      "SELECT image_blog FROM blogs WHERE id_blog = ?", // Hanya perlu image_blog
      [id]
    );
    if (oldData.length === 0) {
      // Jika ada gambar baru terupload ke Cloudinary, hapus jika blog tidak ditemukan
      if (newImageUrl && req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(404).json({ message: "Blog tidak ditemukan" });
    }

    const oldImageUrl = oldData[0].image_blog;

    // Logika untuk menghapus gambar lama di Cloudinary jika ada gambar baru
    if (newImageUrl && oldImageUrl) {
      // Pastikan ada URL lama dan baru
      try {
        // Ekstrak public_id dari oldImageUrl
        const publicIdMatch = oldImageUrl.match(/\/upload\/\w+\/(.+)\.\w+$/);
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1];
          await cloudinary.uploader.destroy(publicId); // Hapus dari Cloudinary
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

    // Tentukan URL gambar yang akan disimpan ke DB
    const imageUrlToSave = newImageUrl || oldImageUrl; // Gunakan gambar baru jika ada, jika tidak, pertahankan yang lama

    await pool.query(
      `
      UPDATE blogs 
      SET title = ?, content = ?, image_blog = ? 
      WHERE id_blog = ?`,
      [title, content, imageUrlToSave, id] // Simpan URL Cloudinary ke database
    );

    res
      .status(200)
      .json({ message: "Blog berhasil diupdate", imageUrl: imageUrlToSave });
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

    const imageUrlToDelete = rows[0].image_blog;

    // Hapus gambar dari Cloudinary jika ada
    if (imageUrlToDelete) {
      try {
        const publicIdMatch = imageUrlToDelete.match(
          /\/upload\/\w+\/(.+)\.\w+$/
        );
        if (publicIdMatch && publicIdMatch[1]) {
          const publicId = publicIdMatch[1];
          await cloudinary.uploader.destroy(publicId); // Hapus dari Cloudinary
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
