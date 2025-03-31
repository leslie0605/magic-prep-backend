require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateQuizData(field) {
  const prompt = `
    Generate a quiz on ${field}. 

    First, create 10 key concepts. Then, create 8 multiple choice questions where each question's options MUST reference the concept IDs you created (not the concept names).

    Requirements:
    1. Each concept must have:
       - id: string starting with "concept-" followed by a number (e.g., "concept-1")
       - name: string
       - description: detailed string explanation
    
    2. Each question must have:
       - id: number (1-5)
       - question: string
       - explanation: string explaining the correct answer
       - correctConcept: string matching one of the concept IDs (e.g., "concept-1")
       - options: array of FOUR concept IDs (e.g., ["concept-1", "concept-2", "concept-3", "concept-4"])
         IMPORTANT: options must be concept IDs, not concept names or text

    Return a JSON object in this exact format:
    {
      "concepts": [
        {
          "id": "concept-1",
          "name": "Example Concept",
          "description": "Detailed description of the concept"
        }
      ],
      "questions": [
        {
          "id": 1,
          "question": "Which concept describes X?",
          "explanation": "Explanation of why this answer is correct",
          "correctConcept": "concept-1",
          "options": ["concept-1", "concept-2", "concept-3", "concept-4"]
        }
      ]
    }
    `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating quiz data:", error);
    throw new Error("Failed to generate quiz data from OpenAI");
  }
}

module.exports = { generateQuizData };
