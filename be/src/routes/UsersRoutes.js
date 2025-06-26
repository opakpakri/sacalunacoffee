const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  addUser,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/UsersController");

router.get("/", getAllUsers);
router.post("/", addUser); // ← Tambahkan ini
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
