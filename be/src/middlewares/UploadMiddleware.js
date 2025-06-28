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
    const originalFilename = path.parse(file.originalname).name;

    return {
      folder: subfolder,
      public_id: `${originalFilename}-${Date.now()}`,
      format: "webp",
      transformation: [{ width: 800, height: 600, crop: "limit" }],
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
