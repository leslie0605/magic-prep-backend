const express = require("express");
const cors = require("cors");
const quizRoutes = require("./routes/quizRoutes");
const cvRoutes = require("./routes/cvRoutes");
const documentRoutes = require("./routes/documentRoutes");
const authRoutes = require("./routes/authRoutes");
const universityRoutes = require("./routes/universityRoutes");
const connectDB = require("./config/db");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();

// Connect to MongoDB
connectDB()
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  // Accept only PDF files for now
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

const app = express();
app.use(express.json());

// CORS configuration - simplified to allow all origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Make uploads directory publicly accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set up file upload route
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    file: {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    },
  });
});

// Set up routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/universities", universityRoutes);

// Basic route for server check
app.get("/", (req, res) => {
  res.send("Magic Prep Backend API is running");
});

// Error handling middleware for multer and other errors
app.use((err, req, res, next) => {
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size cannot exceed 5MB",
    });
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
