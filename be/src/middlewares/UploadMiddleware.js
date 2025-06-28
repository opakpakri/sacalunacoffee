const cloudinary = require("cloudinary").v2; // Import Cloudinary SDK
const { CloudinaryStorage } = require("multer-storage-cloudinary"); // Import CloudinaryStorage for Multer
const multer = require("multer");
const path = require("path"); // Still useful for file extensions if you prefer

// Determine subfolder based on upload type
const getUploadSubfolder = (type) => {
  const folders = {
    menu: "sacaluna_menus", // Unique folder in Cloudinary for menus
    blog: "sacaluna_blogs", // Unique folder in Cloudinary for blogs
  };
  return folders[type] || "sacaluna_uploads"; // Default folder if type is not recognized
};

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const subfolder = getUploadSubfolder(req.uploadType); // Use req.uploadType set by middleware
    const originalFilename = path.parse(file.originalname).name; // Get filename without extension

    return {
      folder: subfolder, // Folder in your Cloudinary account
      public_id: `${originalFilename}-${Date.now()}`, // Unique public ID for the file
      format: "webp", // Convert all uploaded images to webp for optimization (recommended)
      transformation: [{ width: 800, height: 600, crop: "limit" }], // Optional: Apply transformations
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
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB (adjust as needed)
  },
});

module.exports = upload;
