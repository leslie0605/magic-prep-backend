const express = require("express");
const {
  generateQuiz,
  createGame,
  getGames,
  getGameById,
  assignGameToMentee,
  getMenteeGames,
} = require("../controllers/quizController");

const router = express.Router();

// Generate a basic quiz
router.post("/generate", generateQuiz);

// Create a new interactive game
router.post("/games", createGame);

// Get all games
router.get("/games", getGames);

// Get a specific game
router.get("/games/:id", getGameById);

// Assign a game to a mentee
router.post("/games/:id/assign", assignGameToMentee);

// Get games assigned to a specific mentee
router.get("/mentee/:menteeId/games", getMenteeGames);

module.exports = router;
