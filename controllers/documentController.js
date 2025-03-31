const fs = require("fs");
const path = require("path");

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
    const { edits, mentorName, mentorId } = req.body;

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
      timestamp: new Date().toISOString(),
    }));

    // Add the new edits to the document
    documents[documentIndex].mentorEdits = [
      ...documents[documentIndex].mentorEdits,
      ...formattedEdits,
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

    // In a real app, you would trigger notifications to the student here

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        documentId,
        status: "completed",
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
exports.processStudentSubmission = (req, res) => {
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

    // Create sample content based on document type
    let documentContent;
    if (documentType === "cv") {
      documentContent = `# ${documentName}
## ${studentName}

### Education
- PhD Candidate in Computer Science, Stanford University (Expected: 2024)
- MS in Computer Science, University of California, Berkeley (2020)
- BS in Computer Science, Massachusetts Institute of Technology (2018)

### Research Experience
- Research Assistant, Stanford AI Lab (2020-Present)
- Research Intern, Google Research (Summer 2019)
- Undergraduate Research Assistant, MIT CSAIL (2017-2018)

### Publications
- "Deep Learning Applications in Natural Language Processing", ACM Conference on AI, 2022
- "Neural Networks for Computer Vision", IEEE Conference on Computer Vision, 2021

### Skills
- Programming: Python, TensorFlow, PyTorch, Java, C++
- Tools: Git, Docker, AWS, Linux
- Languages: English (Native), Mandarin (Fluent)`;
    } else if (documentType === "sop") {
      documentContent = `# Statement of Purpose for ${
        targetProgram || "PhD Program"
      }
## ${studentName}

When I first encountered machine learning algorithms in my undergraduate studies, I was immediately captivated by their potential to solve complex problems. This fascination led me to pursue research opportunities that combined theoretical foundations with practical applications. During my time at MIT's Computer Science and Artificial Intelligence Laboratory, I worked on developing novel neural network architectures for natural language understanding.

My research interests lie at the intersection of machine learning and natural language processing. Specifically, I am interested in developing models that can understand and generate human language with greater accuracy and efficiency. My previous work has focused on improving transformer-based models for various NLP tasks such as machine translation, summarization, and question answering.

I am applying to ${
        targetUniversity || "your university"
      } because of the exceptional research being conducted by faculty members in the NLP group. I am particularly interested in working with Professor Smith, whose work on efficient language models has greatly influenced my own research direction. The collaborative environment and resources available at ${
        targetUniversity || "your university"
      } would provide an ideal setting for me to grow as a researcher and make meaningful contributions to the field.`;
    } else {
      documentContent = `This is the content of the ${documentName} document submitted by ${studentName}.`;
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
      suggestions: [], // Will be populated by AI analysis in a real implementation
      mentorEdits: [],
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
        isRead: false,
        fileUrl: doc.fileUrl,
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
