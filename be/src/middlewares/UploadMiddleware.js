const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

// --- Fungsi format tanggal YYYYMMDD-HHmmss (Ditambahkan dari versi lama) ---
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
// --- Akhir penambahan formatDate ---

const getUploadSubfolder = (type) => {
  const folders = {
    menu: "sacaluna_menus", // Diubah agar sesuai dengan folder di Cloudinary
    blog: "sacaluna_blogs", // Diubah agar sesuai dengan folder di Cloudinary
  };
  return folders[type] || "sacaluna_uploads";
};

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const subfolder = getUploadSubfolder(req.uploadType);
    const originalFilename = path.parse(file.originalname).name;
    const timestamp = formatDate(); // Gunakan fungsi formatDate di sini

    return {
      folder: subfolder,
      public_id: `${originalFilename}-${timestamp}`, // Menggunakan timestamp dari formatDate
      format: "webp",
      transformation: [{ width: 800, height: 600, crop: "limit" }],
    };
  },
});

// Filter file to only accept jpeg, png, and webp
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only .png, .jpeg, .jpg, and .webp images are allowed"),
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
