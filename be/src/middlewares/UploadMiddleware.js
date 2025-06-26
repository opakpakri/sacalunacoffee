const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

// Tentukan subfolder berdasarkan tipe upload
const getUploadSubfolder = (type) => {
  const folders = {
    menu: "menus",
    blog: "blogs",
  };
  return folders[type] || "";
};

// Konfigurasi storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = getUploadSubfolder(req.uploadType);
    const targetDir = path.join(__dirname, "../uploads", subfolder);

    fs.mkdirSync(targetDir, { recursive: true });

    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const timestamp = formatDate();
    const cleanOriginalName = file.originalname.replace(/\s+/g, "-");
    const filename = `${timestamp}-${cleanOriginalName}`;
    cb(null, filename);
  },
});

// Filter file hanya terima jpeg, png, dan webp
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".jpeg", ".jpg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
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
});

module.exports = upload;
