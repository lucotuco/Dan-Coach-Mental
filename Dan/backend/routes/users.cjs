// Import Express:
const express = require("express");

// Import HTTP-CRUD-request handlers:
const {
  createNewUser,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
} = require("../controllers/userControllers");

// Assign express.Router() to variable 'router':
const router = express.Router();

// Assign handlers to run on certain requests to router on certain paths:

// GET all users
router.get("/", getAllUsers);

// GET single user:
router.get("/:id", getUser);

// POST (create) a new user:
router.post("/", createNewUser);

// DELETE a user:
router.delete("/:id", deleteUser);

// PATCH (update) a user:
router.patch("/:id", updateUser);

// Export router:
module.exports = router;