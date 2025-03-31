const express = require("express");
const router = express.Router();
const {
  getUniversities,
  getUniversity,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  searchUniversities,
  getDepartments,
} = require("../controllers/universityController");

// Base routes
router.route("/").get(getUniversities).post(createUniversity);

// Search route
router.route("/search").get(searchUniversities);

// Individual university routes
router
  .route("/:id")
  .get(getUniversity)
  .put(updateUniversity)
  .delete(deleteUniversity);

// Department routes
router.route("/:id/departments").get(getDepartments);

module.exports = router;
