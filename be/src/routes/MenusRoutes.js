const express = require("express");
const router = express.Router();
const upload = require("../middlewares/UploadMiddleware");
const {
  getAllMenus,
  addMenu,
  updateMenu,
  getMenuById,
  deleteMenu,
  updateMenuStock,
} = require("../controllers/MenusController");

// Middleware untuk set uploadType menu
const setMenuUploadType = (req, res, next) => {
  req.uploadType = "menu";
  next();
};

router.get("/", getAllMenus);
router.post("/", setMenuUploadType, upload.single("image"), addMenu);
router.put("/:id", setMenuUploadType, upload.single("image"), updateMenu);
router.get("/:id", getMenuById);
router.delete("/:id", deleteMenu);
router.put("/:id/stock", updateMenuStock);

module.exports = router;
