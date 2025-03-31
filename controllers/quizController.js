const { createQuizFile } = require("../utils/quizGenerator");
const { processContent } = require("../utils/contentProcessor");
const { generateGameData } = require("../utils/gameGenerator");
const { students } = require("./authController");
const fs = require("fs");
const path = require("path");

// Keep track of games in memory - in a production app, this should be a database
let games = [];
let gameIdCounter = 1;

/**
 * Handles API request to generate a new quiz
 */
exports.generateQuiz = async (req, res) => {
  try {
    const { field } = req.body;
    if (!field) {
      return res.status(400).json({ error: "Field is required" });
    }

    const result = await createQuizFile(field);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
};

/**
 * Create a new interactive game based on content
 */
exports.createGame = async (req, res) => {
  try {
    const { gameType, sourceType, content, title, menteeIds } = req.body;

    if (!gameType || !sourceType || !content) {
      return res.status(400).json({
        error: "Game type, source type, and content are required",
      });
    }

    // Validate menteeIds - ensure they are strings
    const validatedMenteeIds = Array.isArray(menteeIds)
      ? menteeIds.map((id) => String(id))
      : [];

    // Normalize game type to ensure consistent capitalization
    // e.g., "quiz" becomes "Quiz", "matching" becomes "Matching", etc.
    const normalizedGameType =
      gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase();

    console.log("Creating game with menteeIds:", validatedMenteeIds);
    console.log("Game type (original):", gameType);
    console.log("Game type (normalized):", normalizedGameType);

    // Generate a more user-friendly title if one isn't provided
    let gameTitle = title;

    // If it's a PDF file, clean up the filename for display
    if (sourceType === "pdf" && !gameTitle) {
      // Extract filename from content if it's a file path
      if (typeof content === "string" && content.includes(".pdf")) {
        // Get just the filename without extension and path
        const filename = content.split("/").pop()?.replace(".pdf", "") || "";
        // Format filename: replace dashes/underscores with spaces, capitalize words
        gameTitle = filename
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    // Default title if we still don't have one
    if (!gameTitle) {
      gameTitle = `New ${normalizedGameType} Game`;
    }

    // Process the content based on source type
    const processedContent = await processContent(sourceType, content);

    // Generate game data based on processed content and game type
    const gameData = await generateGameData(
      normalizedGameType, // Use normalized game type
      processedContent,
      gameTitle // Use our improved title
    );

    // Create game object
    const game = {
      id: gameIdCounter++,
      title: gameTitle, // Use our improved title
      gameType: normalizedGameType, // Use normalized game type
      sourceType,
      createdAt: new Date(),
      data: gameData,
      assignedTo: validatedMenteeIds,
    };

    // Save game
    games.push(game);

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      gameId: game.id,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({
      error: "Failed to create game",
      message: error.message,
    });
  }
};

/**
 * Get all games
 */
exports.getGames = (req, res) => {
  // Return simplified list without full game data
  const gameList = games.map((game) => ({
    id: game.id,
    title: game.title,
    gameType: game.gameType,
    sourceType: game.sourceType,
    createdAt: game.createdAt,
    assignedTo: game.assignedTo,
  }));

  res.status(200).json(gameList);
};

/**
 * Get a specific game by ID
 */
exports.getGameById = (req, res) => {
  const gameId = parseInt(req.params.id);
  const game = games.find((g) => g.id === gameId);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  res.status(200).json(game);
};

/**
 * Assign a game to a mentee
 */
exports.assignGameToMentee = (req, res) => {
  const gameId = parseInt(req.params.id);
  const { menteeIds } = req.body;

  if (!menteeIds || !Array.isArray(menteeIds)) {
    return res.status(400).json({ error: "Mentee IDs array is required" });
  }

  const gameIndex = games.findIndex((g) => g.id === gameId);

  if (gameIndex === -1) {
    return res.status(404).json({ error: "Game not found" });
  }

  // Update game with new mentee assignments
  games[gameIndex].assignedTo = Array.from(
    new Set([...games[gameIndex].assignedTo, ...menteeIds])
  );

  res.status(200).json({
    success: true,
    message: "Game assigned successfully",
    assignedTo: games[gameIndex].assignedTo,
  });
};

/**
 * Get games assigned to a specific mentee
 */
exports.getMenteeGames = (req, res) => {
  const menteeId = req.params.menteeId;

  // Check if the mentee exists (skipping for 'current-student' which is a legacy identifier)
  if (menteeId !== "current-student") {
    const studentExists = students.some((student) => student.id === menteeId);
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
  }

  // Find all games assigned to this mentee
  const menteeGames = games
    .filter((game) => {
      // Special handling for 'current-student' to return all games (for backward compatibility)
      if (menteeId === "current-student") {
        return true;
      }
      // Otherwise, return games specifically assigned to this student
      return game.assignedTo.includes(menteeId);
    })
    .map((game) => ({
      id: game.id,
      title: game.title,
      gameType: game.gameType,
      createdAt: game.createdAt,
      data: game.data,
    }));

  res.status(200).json(menteeGames);
};
