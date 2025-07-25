const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");

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
    const imageUrl = req.file?.path;
    const currentTime = getJakartaDateTime();

    if (!title || !content || !imageUrl) {
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }

      return res
        .status(400)
        .json({ message: "Semua field harus diisi, termasuk gambar" });
    }
    await pool.query(
      "INSERT INTO blogs (title, content, image_blog, time) VALUES (?, ?, ?, ?)",
      [title, content, imageUrl, currentTime]
    );

    res
      .status(201)
      .json({ message: "Blog berhasil ditambahkan", imageUrl: imageUrl });
  } catch (err) {
    console.error("Error adding blog:", err.message); // Jika ada gambar yang terupload ke Cloudinary sebelum error DB, hapus juga

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
    const newImageUrl = req.file?.path;
    const [oldData] = await pool.query(
      "SELECT image_blog FROM blogs WHERE id_blog = ?",
      [id]
    );

    if (oldData.length === 0) {
      if (newImageUrl && req.file?.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      }
      return res.status(404).json({ message: "Blog tidak ditemukan" });
    }

    const oldImageUrl = oldData[0].image_blog;
    if (newImageUrl && oldImageUrl) {
      try {
        const publicIdMatch = oldImageUrl.match(/\/upload\/\w+\/(.+)\.\w+$/);
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
      `UPDATE blogs SET title = ?, content = ?, image_blog = ? WHERE id_blog = ?`,
      [title, content, imageUrlToSave, id]
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
    res.status(200).json(rows[0]);
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

    if (imageUrlToDelete) {
      try {
        const publicIdMatch = imageUrlToDelete.match(
          /\/upload\/\w+\/(.+)\.\w+$/
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
