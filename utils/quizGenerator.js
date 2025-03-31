const fs = require("fs");
const path = require("path");
const { generateQuizData } = require("./quizAI");

async function createQuizFile(field) {
  const fileName = `${field.toLowerCase()}QuizData.ts`;
  const filePath = path.join(__dirname, fileName);

  // Map common subjects to appropriate icons
  const getIconForField = (field) => {
    const iconMap = {
      music: "music",
      physics: "atom",
      chemistry: "flask",
      biology: "leaf",
      math: "calculator",
      history: "book",
      geography: "globe",
      literature: "book",
      computer: "laptop",
      art: "palette",
    };
    return iconMap[field.toLowerCase()] || "book";
  };

  // Get AI-generated quiz content
  const { concepts, questions } = await generateQuizData(field);

  const fileContent = `
export interface Concept {
  id: string;
  name: string;
  description: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  explanation: string;
  correctConcept: string;
  options: string[];
}

export const quizMetadata = {
  id: "${field.toLowerCase()}-quiz",
  title: "Quiz on ${field} Concepts",
  description: "Test your knowledge about ${field} concepts.",
  icon: "${getIconForField(field)}"
};

export const concepts: Concept[] = ${JSON.stringify(concepts, null, 2)};
export const quizQuestions: QuizQuestion[] = ${JSON.stringify(
    questions,
    null,
    2
  )};
`;

  fs.writeFileSync(filePath, fileContent);
  console.log(`Quiz file created: ${filePath}`);
  return { success: true, file: fileName };
}

module.exports = { createQuizFile };
