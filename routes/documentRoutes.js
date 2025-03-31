const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for original uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Configure storage for edited document uploads
const editedStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create the edited directory if it doesn't exist
    const dir = path.join(__dirname, "../uploads/edited");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, "edited-" + Date.now() + "-" + file.originalname);
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

// Create multer instances for different upload purposes
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

const editedUpload = multer({
  storage: editedStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// SOP and PHS upload routes
router.post("/sop", upload.single("sopFile"), documentController.uploadSOP);
router.post("/phs", upload.single("phsFile"), documentController.uploadPHS);

// Document files routes
router.get("/files/:filename", documentController.getDocumentFile);
router.get("/edited-files/:filename", documentController.getEditedDocumentFile);

// Get documents by student ID - specific route must come before generic /:id route
router.get("/student/:studentId", documentController.getStudentDocuments);

// Get feedback notifications for a student - specific route must come before generic /:id route
router.get(
  "/notifications/:studentId",
  documentController.getStudentFeedbackNotifications
);

// Get all documents
router.get("/", documentController.getAllDocuments);

// Get a specific document - should come after specific paths with parameters
router.get("/:id", documentController.getDocumentById);

// Create a new document
router.post("/", documentController.createDocument);

// Process student document submission
router.post("/student-submission", documentController.processStudentSubmission);

// Upload edited document
router.post(
  "/edited-document",
  editedUpload.single("editedFile"),
  documentController.uploadEditedDocument
);

// Save mentor edits
router.post("/:id/edits", documentController.saveEdits);

// Save mentor's response to AI suggestions
router.post("/:id/suggestions", documentController.respondToSuggestion);

// Submit final feedback
router.post("/:id/feedback", documentController.submitFeedback);

module.exports = router;
