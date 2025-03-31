const path = require("path");
const fs = require("fs");
const { analyzeCV } = require("../utils/openaiService"); // Import the OpenAI service
const PDFParser = require("pdf-parse"); // Let's assume we have this library for PDF parsing
const mammoth = require("mammoth");
const textract = require("textract");
const util = require("util");
const textractAsync = util.promisify(textract.fromFileWithPath);

// Handle CV file upload
exports.uploadCV = async (req, res) => {
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
      console.log("Error extracting file content:", extractionError);
      // Continue with an empty content if extraction fails
      fileContent = `Unable to extract content from ${req.file.originalname}`;
    }

    // If we have content, analyze the CV using OpenAI
    let analysisResult = { score: 0, feedback: [] };

    if (fileContent && fileContent.length > 100) {
      // Ensure we have enough content to analyze
      try {
        analysisResult = await analyzeCV(fileContent);
        console.log("OpenAI Analysis Result:", analysisResult);
      } catch (aiError) {
        console.log("Error getting AI analysis:", aiError);
        // Continue with default values if analysis fails
      }
    } else {
      console.log("Insufficient content for analysis");
    }

    // Send response with file details and analysis
    res.status(200).json({
      success: true,
      message: "CV uploaded successfully",
      data: {
        file: fileDetails,
        fileUrl: `/api/cv/files/${req.file.filename}`,
        analysis: {
          score: analysisResult.score,
          feedback: analysisResult.feedback,
        },
      },
    });
  } catch (error) {
    console.error("Error in CV upload:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading CV",
      error: error.message,
    });
  }
};

// Get CV file
exports.getCVFile = (req, res) => {
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
    console.error("Error getting CV file:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving file",
      error: error.message,
    });
  }
};
