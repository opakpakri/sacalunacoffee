const express = require("express");
const router = express.Router();
const upload = require("../middlewares/UploadMiddleware");
const {
  getAllBlogs,
  addBlog,
  updateBlog,
  getBlogById,
  deleteBlog,
} = require("../controllers/BlogsController");

// Middleware untuk set uploadType blog
const setBlogUploadType = (req, res, next) => {
  req.uploadType = "blog";
  next();
};

router.get("/", getAllBlogs);
router.post("/", setBlogUploadType, upload.single("image"), addBlog);
router.put("/:id", setBlogUploadType, upload.single("image"), updateBlog);
router.get("/:id", getBlogById);
router.delete("/:id", deleteBlog);

module.exports = router;
