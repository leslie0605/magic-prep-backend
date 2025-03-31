const express = require("express");
const {
  login,
  getStudents,
  getUserProfile,
} = require("../controllers/authController");

const router = express.Router();

// Login route
router.post("/login", login);

// Get all students (for mentors)
router.get("/students", getStudents);

// Get user profile
router.get("/profile/:role/:userId", getUserProfile);

module.exports = router;
