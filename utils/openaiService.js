require("dotenv").config();
const OpenAI = require("openai");

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze a CV/resume and provide a score and feedback
 * @param {string} cvContent - The content of the CV to analyze
 * @returns {Promise<{score: number, feedback: string[]}>} - Score and feedback
 */
async function analyzeCV(cvContent) {
  try {
    const prompt = `
    You are an expert career consultant and PhD mentor specialized in evaluating academic CVs/resumes.
    Please analyze the following CV/resume content and:
    
    1. Evaluate its strengths and weaknesses on a scale of 0-100.
    2. Provide 3-5 specific pieces of feedback for improvement focusing on content, structure, and academic merits.
    3. Consider format, clarity, academic achievements, research experience, publications, and relevance to PhD applications.
    
    CV Content:
    ${cvContent}
    
    Respond in the following JSON format:
    {
      "score": <number between 0-100>,
      "feedback": [
        "<specific feedback point 1>",
        "<specific feedback point 2>",
        "<specific feedback point 3>",
        "<optional specific feedback point 4>",
        "<optional specific feedback point 5>"
      ]
    }
    `;

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    // Parse the response
    const responseContent = response.choices[0].message.content;
    const resultJSON = JSON.parse(responseContent);

    // Validate and format the result
    const score = Math.min(100, Math.max(0, Math.round(resultJSON.score))); // Ensure score is between 0-100
    const feedback = resultJSON.feedback.filter(
      (item) => item && item.trim() !== ""
    ); // Remove any empty feedback items

    return {
      score,
      feedback,
    };
  } catch (error) {
    console.error("Error analyzing CV with OpenAI:", error);

    // Return default values in case of error
    return {
      score: 50,
      feedback: [
        "We couldn't analyze your CV completely. Please try again later.",
        "Make sure your CV includes key sections like education, research experience, and publications.",
        "Consider highlighting your academic achievements and skills relevant to your field.",
      ],
    };
  }
}

module.exports = {
  analyzeCV,
};
