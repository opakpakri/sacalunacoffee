const multer = require("multer");
const path = require("path");

const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const getUploadSubfolder = (type) => {
  const folders = {
    menu: "sacaluna_menus",
    blog: "sacaluna_blogs",
  };
  return folders[type] || "sacaluna_uploads";
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const subfolder = getUploadSubfolder(req.uploadType);

    // --- PERUBAHAN UTAMA DI SINI ---
    // 1. Ambil nama file asli tanpa ekstensi
    const originalNameWithoutExt = path.parse(file.originalname).name;
    // 2. Ganti semua spasi (satu atau lebih) dengan underscore (_)
    //    Ini akan memastikan public_id yang disimpan di Cloudinary tidak mengandung spasi
    const cleanedFilename = originalNameWithoutExt.replace(/\s+/g, "_");
    // --- AKHIR PERUBAHAN ---

    // Menggunakan Date.now() sebagai timestamp (sesuai dengan kode Anda)
    const timestamp = Date.now();

    return {
      folder: subfolder,
      public_id: `${cleanedFilename}-${timestamp}`, // Menggunakan nama file yang sudah dibersihkan
      format: "webp", // Pastikan format yang konsisten dan efisien
      transformation: [{ width: 800, height: 600, crop: "limit" }], // Contoh transformasi
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Hanya gambar dengan format .png, .jpeg, .jpg, dan .webp yang diizinkan"
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
