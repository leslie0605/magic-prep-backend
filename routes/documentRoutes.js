const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");

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

// Save mentor edits
router.post("/:id/edits", documentController.saveEdits);

// Save mentor's response to AI suggestions
router.post("/:id/suggestions", documentController.respondToSuggestion);

// Submit final feedback
router.post("/:id/feedback", documentController.submitFeedback);

module.exports = router;
