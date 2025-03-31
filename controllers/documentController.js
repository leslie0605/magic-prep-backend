const fs = require("fs");
const path = require("path");
const { analyzeSOP, analyzePHS } = require("../utils/openaiService");
const PDFParser = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const util = require("util");
const textractAsync = util.promisify(textract.fromFileWithPath);

// Mock database for documents
// In a real application, this would use a database
let documents = [];

// Get all documents
exports.getAllDocuments = (req, res) => {
  try {
    // In a real app, you would apply filters based on authenticated user
    const documentList = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      studentName: doc.studentName,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: documentList,
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve documents",
      error: error.message,
    });
  }
};

// Get document by ID
exports.getDocumentById = (req, res) => {
  try {
    const documentId = req.params.id;
    const document = documents.find((doc) => doc.id === documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve document",
      error: error.message,
    });
  }
};

// Create a new document
exports.createDocument = (req, res) => {
  try {
    const { title, content, type, studentName, studentId } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const newDocument = {
      id: Date.now().toString(),
      title,
      content,
      type: type || "Document",
      studentName: studentName || "Anonymous Student",
      studentId: studentId || "unknown",
      suggestions: [],
      mentorEdits: [],
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    documents.push(newDocument);

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      data: newDocument,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create document",
      error: error.message,
    });
  }
};

// Save mentor edits
exports.saveEdits = (req, res) => {
  try {
    const documentId = req.params.id;
    const { edits, mentorName, mentorId, mentorTags = [] } = req.body;

    if (!edits || !Array.isArray(edits)) {
      return res.status(400).json({
        success: false,
        message: "Edits array is required",
      });
    }

    const documentIndex = documents.findIndex((doc) => doc.id === documentId);

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Format new edits with mentor information and timestamp
    const formattedEdits = edits.map((edit) => ({
      id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: edit.text,
      position: edit.position,
      originalText: edit.originalText || "",
      mentorName: mentorName || "Anonymous Mentor",
      mentorId: mentorId || "unknown",
      mentorTags: mentorTags || [], // Add mentor tags for tracking
      timestamp: new Date().toISOString(),
    }));

    // Add the new edits to the document
    documents[documentIndex].mentorEdits = [
      ...documents[documentIndex].mentorEdits,
      ...formattedEdits,
    ];

    // Also add to the comprehensive edit history
    documents[documentIndex].editHistory = [
      ...(documents[documentIndex].editHistory || []),
      ...formattedEdits.map((edit) => ({
        ...edit,
        editType: "direct",
      })),
    ];

    // Update the document content with the edits
    // In a real app, you would handle conflict resolution here

    // Update the last modified timestamp
    documents[documentIndex].updatedAt = new Date().toISOString();

    res.status(200).json({
      success: true,
      message: "Edits saved successfully",
      data: {
        documentId,
        edits: formattedEdits,
      },
    });
  } catch (error) {
    console.error("Error saving edits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save edits",
      error: error.message,
    });
  }
};

// Respond to an AI suggestion
exports.respondToSuggestion = (req, res) => {
  try {
    const documentId = req.params.id;
    const { suggestionId, accepted, mentorName, mentorId } = req.body;

    if (!suggestionId || typeof accepted !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Suggestion ID and accepted status are required",
      });
    }

    const documentIndex = documents.findIndex((doc) => doc.id === documentId);

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const document = documents[documentIndex];
    const suggestionIndex = document.suggestions.findIndex(
      (s) => s.id === suggestionId
    );

    if (suggestionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    // Update the suggestion status
    document.suggestions[suggestionIndex].resolved = true;
    document.suggestions[suggestionIndex].accepted = accepted;

    // If accepted, add to mentor edits
    if (accepted) {
      const suggestion = document.suggestions[suggestionIndex];

      const newEdit = {
        id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: suggestion.suggestedText,
        position: suggestion.position,
        originalText: suggestion.originalText,
        mentorName: mentorName || "Anonymous Mentor",
        mentorId: mentorId || "unknown",
        fromSuggestion: true,
        suggestionId: suggestion.id,
        timestamp: new Date().toISOString(),
      };

      document.mentorEdits.push(newEdit);
    }

    // Update the document's timestamp
    document.updatedAt = new Date().toISOString();

    res.status(200).json({
      success: true,
      message: `Suggestion ${accepted ? "accepted" : "rejected"} successfully`,
      data: {
        documentId,
        suggestionId,
        suggestion: document.suggestions[suggestionIndex],
      },
    });
  } catch (error) {
    console.error("Error responding to suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to respond to suggestion",
      error: error.message,
    });
  }
};

// Submit final feedback
exports.submitFeedback = (req, res) => {
  try {
    const documentId = req.params.id;
    const { mentorName, mentorId, feedbackComments } = req.body;

    const documentIndex = documents.findIndex((doc) => doc.id === documentId);

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Update document status
    documents[documentIndex].status = "completed";
    documents[documentIndex].updatedAt = new Date().toISOString();
    documents[documentIndex].feedbackComments = feedbackComments || "";

    // Check if there's an edited file attached to this document
    const hasEditedFile = !!documents[documentIndex].editedFileUrl;

    // In a real app, you would trigger notifications to the student here
    // Example: sending an email notification with links to download the edited file
    console.log(`Feedback submitted for document ${documentId}.`);
    console.log(`Edited file available: ${hasEditedFile ? "Yes" : "No"}`);
    if (hasEditedFile) {
      console.log(`Edited file URL: ${documents[documentIndex].editedFileUrl}`);
    }

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        documentId,
        status: "completed",
        hasEditedFile,
        editedFileUrl: documents[documentIndex].editedFileUrl || null,
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// Process document submission from student
exports.processStudentSubmission = async (req, res) => {
  try {
    const {
      documentId,
      documentName,
      documentType,
      studentId,
      studentName,
      fileUrl,
      targetProgram,
      targetUniversity,
    } = req.body;

    if (
      !documentId ||
      !documentName ||
      !documentType ||
      !studentId ||
      !studentName ||
      !fileUrl
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for document submission",
      });
    }

    // Map documentType to a more readable format for the mentor dashboard
    let documentDisplayType;
    switch (documentType.toLowerCase()) {
      case "cv":
        documentDisplayType = "CV/Resume";
        break;
      case "sop":
        documentDisplayType = "Statement of Purpose";
        break;
      case "phs":
        documentDisplayType = "Personal History Statement";
        break;
      default:
        documentDisplayType = documentType;
    }

    // Extract the filename from the fileUrl
    const filename = fileUrl.split("/").pop();
    const filePath = path.join(__dirname, "../uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found at path: ${filePath}`);
    }

    // Extract content for preview purposes
    let documentContent = "";

    try {
      // Get the file extension to determine how to extract content
      const fileExtension = path.extname(filename).toLowerCase();

      if (fileExtension === ".pdf") {
        // Extract content from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await PDFParser(dataBuffer);
        documentContent = pdfData.text;
      } else if (fileExtension === ".docx") {
        // Extract content from DOCX
        const result = await mammoth.extractRawText({
          path: filePath,
        });
        documentContent = result.value;
      } else if (fileExtension === ".doc") {
        // Extract content from DOC
        documentContent = await textractAsync(filePath, {
          preserveLineBreaks: true,
        });
      } else if (fileExtension === ".tex") {
        // Extract content from TEX
        documentContent = await textractAsync(filePath, {
          preserveLineBreaks: true,
        });
      } else {
        // Fallback for other formats
        try {
          documentContent = await textractAsync(filePath, {
            preserveLineBreaks: true,
          });
        } catch (e) {
          console.warn(
            `Failed to extract content using textract: ${e.message}`
          );
          // Read as text file as last resort
          documentContent = fs.readFileSync(filePath, "utf8");
        }
      }
    } catch (extractionError) {
      console.error(
        `Error extracting content from file ${filename}:`,
        extractionError
      );
      documentContent = `[Unable to extract content from ${filename}. The file may be corrupted or in an unsupported format.]`;
    }

    // If we couldn't extract any content, provide a fallback message
    if (!documentContent || documentContent.trim().length === 0) {
      documentContent = `[This is a ${documentDisplayType} document submitted by ${studentName}. The content could not be extracted for preview.]`;
    }

    // Create a new document from the student submission with appropriate fields for mentor review
    const newDocument = {
      id: documentId,
      title: documentName,
      content: documentContent,
      type: documentDisplayType,
      studentName,
      studentId,
      targetProgram,
      targetUniversity,
      fileUrl,
      originalFilePath: filePath, // Store reference to original file
      originalFileName: filename, // Store original filename
      suggestions: [], // Will be populated by AI analysis in a real implementation
      mentorEdits: [],
      editHistory: [], // To track complete edit history with mentor attribution
      status: "pending", // New status - ready for mentor review
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to documents array
    const existingDocIndex = documents.findIndex(
      (doc) => doc.id === documentId
    );
    if (existingDocIndex >= 0) {
      documents[existingDocIndex] = newDocument;
    } else {
      documents.push(newDocument);
    }

    console.log(
      `Document '${documentName}' added for review by mentor. Total documents: ${documents.length}`
    );

    res.status(201).json({
      success: true,
      message: "Document processed successfully",
      data: newDocument,
    });
  } catch (error) {
    console.error("Error processing student document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process document submission",
      error: error.message,
    });
  }
};

// Get documents by student ID
exports.getStudentDocuments = (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const studentDocuments = documents.filter(
      (doc) => doc.studentId === studentId
    );

    res.status(200).json({
      success: true,
      data: studentDocuments,
    });
  } catch (error) {
    console.error("Error getting student documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student documents",
      error: error.message,
    });
  }
};

// Get mentor feedback notifications for a student
exports.getStudentFeedbackNotifications = (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Find completed documents for this student
    const completedDocs = documents.filter(
      (doc) => doc.studentId === studentId && doc.status === "completed"
    );

    // Create notification objects
    const notifications = completedDocs.map((doc) => {
      const lastEdit =
        doc.mentorEdits.length > 0
          ? doc.mentorEdits[doc.mentorEdits.length - 1]
          : null;

      // Find the last file edit
      const fileEdits = doc.editHistory
        ? doc.editHistory.filter((edit) => edit.editType === "file")
        : [];
      const lastFileEdit =
        fileEdits.length > 0 ? fileEdits[fileEdits.length - 1] : null;

      return {
        id: `notification-${doc.id}`,
        documentId: doc.id,
        documentName: doc.title,
        mentorName: lastEdit ? lastEdit.mentorName : "Your Mentor",
        date: doc.updatedAt,
        editsAccepted: doc.mentorEdits.filter((edit) => edit.fromSuggestion)
          .length,
        commentsAdded: doc.mentorEdits.filter((edit) => !edit.fromSuggestion)
          .length,
        fileEdited: !!lastFileEdit,
        isRead: false,
        fileUrl: doc.fileUrl, // Original file URL
        editedFileUrl: doc.editedFileUrl, // The edited file URL to send back to student
        hasEditedFile: !!doc.editedFileUrl,
        feedbackComments: doc.feedbackComments,
      };
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error getting feedback notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve feedback notifications",
      error: error.message,
    });
  }
};

// Common document processing function
const processDocument = async (req, res, analyzeFunction, documentType) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get file details
    const fileDetails = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    // Extract text content from the file for AI analysis
    let fileContent = "";

    try {
      // For PDF files
      if (req.file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await PDFParser(dataBuffer);
        fileContent = data.text;
      }
      // For DOCX files
      else if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({
          path: req.file.path,
        });
        fileContent = result.value;
      }
      // For DOC files
      else if (req.file.mimetype === "application/msword") {
        fileContent = await textractAsync(req.file.path, {
          preserveLineBreaks: true,
        });
      }
      // For TEX files
      else if (
        req.file.mimetype === "application/x-tex" ||
        path.extname(req.file.originalname).toLowerCase() === ".tex"
      ) {
        fileContent = await textractAsync(req.file.path, {
          preserveLineBreaks: true,
        });
      }
      // For any other supported file types
      else {
        // Use textract as a fallback for other document types
        fileContent = await textractAsync(req.file.path, {
          preserveLineBreaks: true,
        });
      }
    } catch (extractionError) {
      console.log(`Error extracting ${documentType} content:`, extractionError);
      // Continue with an empty content if extraction fails
      fileContent = `Unable to extract content from ${req.file.originalname}`;
    }

    // If we have content, analyze the document using OpenAI
    let analysisResult = { score: 0, feedback: [] };

    if (fileContent && fileContent.length > 100) {
      // Ensure we have enough content to analyze
      try {
        analysisResult = await analyzeFunction(fileContent);
        console.log(`OpenAI ${documentType} Analysis Result:`, analysisResult);
      } catch (aiError) {
        console.log(`Error getting AI analysis for ${documentType}:`, aiError);
        // Continue with default values if analysis fails
      }
    } else {
      console.log(`Insufficient content for ${documentType} analysis`);
    }

    // Send response with file details and analysis
    res.status(200).json({
      success: true,
      message: `${documentType} uploaded successfully`,
      data: {
        file: fileDetails,
        fileUrl: `/api/documents/files/${req.file.filename}`,
        analysis: {
          score: analysisResult.score,
          feedback: analysisResult.feedback,
        },
      },
    });
  } catch (error) {
    console.error(`Error in ${documentType} upload:`, error);
    res.status(500).json({
      success: false,
      message: `Error uploading ${documentType}`,
      error: error.message,
    });
  }
};

// Handle SOP file upload
exports.uploadSOP = async (req, res) => {
  await processDocument(req, res, analyzeSOP, "Statement of Purpose");
};

// Handle PHS file upload
exports.uploadPHS = async (req, res) => {
  await processDocument(req, res, analyzePHS, "Personal History Statement");
};

// Get document file (original version)
exports.getDocumentFile = (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error getting document file:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving file",
      error: error.message,
    });
  }
};

// Upload edited document file
exports.uploadEditedDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const {
      documentId,
      mentorName,
      mentorId,
      mentorTags = [],
      editSummary = "",
    } = req.body;

    if (!documentId || !mentorId) {
      return res.status(400).json({
        success: false,
        message: "Document ID and mentor ID are required",
      });
    }

    const documentIndex = documents.findIndex((doc) => doc.id === documentId);

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Store the edited file details
    const editedFileDetails = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    // Create a record of this file edit
    const editRecord = {
      id: `file-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      editType: "file",
      fileDetails: editedFileDetails,
      mentorName: mentorName || "Anonymous Mentor",
      mentorId: mentorId,
      mentorTags: mentorTags,
      editSummary: editSummary,
      timestamp: new Date().toISOString(),
    };

    // Add the edit record to edit history
    if (!documents[documentIndex].editHistory) {
      documents[documentIndex].editHistory = [];
    }
    documents[documentIndex].editHistory.push(editRecord);

    // Update the document's edited file URL
    documents[
      documentIndex
    ].editedFileUrl = `/api/documents/edited-files/${req.file.filename}`;
    documents[documentIndex].updatedAt = new Date().toISOString();

    res.status(200).json({
      success: true,
      message: "Edited document uploaded successfully",
      data: {
        documentId,
        editedFileUrl: documents[documentIndex].editedFileUrl,
        editRecord: editRecord,
      },
    });
  } catch (error) {
    console.error("Error uploading edited document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload edited document",
      error: error.message,
    });
  }
};

// Get edited document file
exports.getEditedDocumentFile = (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads/edited", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Edited file not found",
      });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error getting edited document file:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving edited file",
      error: error.message,
    });
  }
};
