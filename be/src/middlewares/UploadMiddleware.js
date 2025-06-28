const multer = require("multer");
const path = require("path");
// const fs = require("fs"); // Tidak lagi diperlukan karena tidak menyimpan ke lokal

const cloudinary = require("../config/cloudinary"); // Impor instance Cloudinary yang sudah dikonfigurasi
const { CloudinaryStorage } = require("multer-storage-cloudinary"); // Impor CloudinaryStorage untuk Multer

// Fungsi format tanggal YYYYMMDD-HHmmss
const formatDate = () => {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  const second = pad(d.getSeconds());

  return `${year}${month}${day}${hour}${minute}${second}`;
};

// Tentukan subfolder di Cloudinary berdasarkan tipe upload
const getUploadSubfolder = (type) => {
  const folders = {
    menu: "sacaluna_menus", // Nama folder di Cloudinary untuk menu
    blog: "sacaluna_blogs", // Nama folder di Cloudinary untuk blog
  };
  // Jika tipe tidak dikenali, default ke folder umum 'sacaluna_uploads'
  return folders[type] || "sacaluna_uploads";
};

// Konfigurasi Cloudinary storage untuk Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Menggunakan instance 'cloudinary' yang sudah dikonfigurasi
  params: async (req, file) => {
    const subfolder = getUploadSubfolder(req.uploadType); // Menggunakan req.uploadType yang disetel oleh middleware sebelumnya
    const originalFilename = path.parse(file.originalname).name; // Mendapatkan nama file asli tanpa ekstensi
    const timestamp = formatDate(); // Mendapatkan timestamp menggunakan fungsi formatDate

    return {
      folder: subfolder, // Folder tujuan di akun Cloudinary Anda
      public_id: `${originalFilename}-${timestamp}`, // ID publik unik untuk file (nama_asli-timestamp)
      format: "webp", // Opsional: Konversi semua gambar ke format webp untuk optimisasi
      transformation: [{ width: 800, height: 600, crop: "limit" }], // Opsional: Terapkan transformasi (misal: resize)
    };
  },
});

// Filter file hanya menerima tipe gambar tertentu (jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]; // Perhatikan penambahan 'image/jpg'
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Mengembalikan pesan error yang lebih spesifik jika tipe file tidak diizinkan
    cb(
      new Error(
        "Hanya gambar dengan format .png, .jpeg, .jpg, dan .webp yang diizinkan"
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage, // Menggunakan storage Cloudinary
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Batas ukuran file 5MB (sesuaikan jika perlu)
  },
});

module.exports = upload;
