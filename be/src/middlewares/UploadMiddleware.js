// src/middlewares/UploadMiddleware.js
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

const getUploadSubfolder = (type) => {
  const folders = {
    menu: "menus",
    blog: "blogs",
  };
  return folders[type] || "sacaluna_uploads";
};

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const subfolder = getUploadSubfolder(req.uploadType);
    const originalFilename = path.parse(file.originalname).name;

    return {
      folder: subfolder,
      public_id: `${originalFilename}-${Date.now()}`,
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
