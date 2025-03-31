const { OpenAI } = require("openai");

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate game data based on processed content and game type
 * @param {string} gameType - Type of game (Quiz, Matching, Flashcard)
 * @param {string} content - Processed content
 * @param {string} title - Game title
 * @returns {Promise<object>} - Structured game data
 */
async function generateGameData(gameType, content, title) {
  try {
    console.log(`Generating ${gameType} game data from content`);

    // Normalize game type to ensure consistent capitalization
    const normalizedType =
      gameType.charAt(0).toUpperCase() + gameType.slice(1).toLowerCase();

    switch (normalizedType) {
      case "Quiz":
        return await generateQuizGame(content, title);
      case "Matching":
        return await generateMatchingGame(content, title);
      case "Flashcard":
        return await generateFlashcardGame(content, title);
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
  } catch (error) {
    console.error(`Error generating ${gameType} game:`, error);
    throw error;
  }
}

/**
 * Generate a quiz game from content
 * @param {string} content - Processed content
 * @param {string} title - Game title
 * @returns {Promise<object>} - Quiz game data
 */
async function generateQuizGame(content, title) {
  const prompt = `
  You are an expert educational content creator. You need to create a quiz game based on the following content.
  
  Content:
  ${content}
  
  Please extract key concepts from the content and create quiz questions related to real-life scenarios.

  Requirements:
  1. Extract 8-12 key concepts from the content. Each concept must have:
     - id: string (slugified concept name, e.g., "frontal-lobe")
     - name: string (short name for the concept)
     - description: string (detailed explanation)
  
  2. Create 8 questions. Each question must:
     - Be related to a real-life scenario that applies the concept
     - Include an explanation that connects the scenario to the concept
     - Reference one of the concepts as the correct answer
     - Have id, question, explanation, and correctConcept fields
  
  The concept here is key concepts extracted from the data source.
  The question here is generated from the data source and should be related to people's real-life scenarios.
  
  Return a JSON object with the following structure:
  {
    "metadata": {
      "id": "generated-quiz",
      "title": "${title}",
      "description": "A brief description about this quiz",
      "type": "Quiz",
      "icon": "brain"
    },
    "concepts": [
      {
        "id": "concept-id",
        "name": "Concept Name",
        "description": "Detailed description"
      }
    ],
    "questions": [
      {
        "id": 1,
        "question": "Real-life scenario question?",
        "explanation": "Explanation connecting the scenario to the concept",
        "correctConcept": "concept-id"
      }
    ]
  }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Generate a matching game from content
 * @param {string} content - Processed content
 * @param {string} title - Game title
 * @returns {Promise<object>} - Matching game data
 */
async function generateMatchingGame(content, title) {
  const prompt = `
  You are an expert educational content creator. You need to create a matching game based on the following content.
  
  Content:
  ${content}
  
  Please extract key concepts from the content and create pairs for a matching game.

  Requirements:
  1. Extract 10-15 key concepts from the content. Each concept must have:
     - id: string (unique identifier)
     - term: string (the term or concept name)
     - definition: string (detailed explanation of the term)
  
  2. These concepts will be used in a matching game where students match terms with their definitions.
  
  The concept here is key concepts extracted from the data source.
  
  Return a JSON object with the following structure:
  {
    "metadata": {
      "id": "generated-matching",
      "title": "${title}",
      "description": "Match terms with their definitions",
      "type": "Matching",
      "icon": "puzzle"
    },
    "pairs": [
      {
        "id": "pair-1", 
        "term": "Term Name",
        "definition": "Definition of the term"
      }
    ]
  }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Generate a flashcard game from content
 * @param {string} content - Processed content
 * @param {string} title - Game title
 * @returns {Promise<object>} - Flashcard game data
 */
async function generateFlashcardGame(content, title) {
  const prompt = `
  You are an expert educational content creator. You need to create a flashcard game based on the following content.
  
  Content:
  ${content}
  
  Please extract key concepts from the content and create flashcards.

  Requirements:
  1. Create 12-15 flashcards based on the content. Each flashcard must have:
     - id: string (unique identifier)
     - front: string (question or term)
     - back: string (answer or explanation)
     - category: string (optional category or topic)
  
  The concept here is key concepts extracted from the data source.
  
  Return a JSON object with the following structure:
  {
    "metadata": {
      "id": "generated-flashcards",
      "title": "${title}",
      "description": "Study flashcards to learn key concepts",
      "type": "Flashcard",
      "icon": "book"
    },
    "cards": [
      {
        "id": "card-1",
        "front": "Question or term",
        "back": "Answer or explanation",
        "category": "Optional category"
      }
    ]
  }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = {
  generateGameData,
};
