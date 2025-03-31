const express = require("express");
const router = express.Router();
const cvController = require("../controllers/cvController");
const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept pdf, doc, docx, and tex files
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword" ||
    file.mimetype === "application/x-tex" ||
    path.extname(file.originalname).toLowerCase() === ".tex"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX, and TEX files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// CV upload route
router.post("/upload", upload.single("cvFile"), cvController.uploadCV);

// Get CV file route
router.get("/files/:filename", cvController.getCVFile);

module.exports = router;
