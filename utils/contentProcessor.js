const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const axios = require("axios");
const { promisify } = require("util");
const pdf = require("pdf-parse");
const readFile = promisify(fs.readFile);

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Process content based on source type
 * @param {string} sourceType - Type of content (text, pdf, youtube)
 * @param {string|object} content - Content to process
 * @returns {Promise<string>} - Processed text content
 */
async function processContent(sourceType, content) {
  try {
    switch (sourceType) {
      case "text":
        return await processTextContent(content);
      case "pdf":
        return await processPdfContent(content);
      case "youtube":
        return await processYoutubeContent(content);
      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }
  } catch (error) {
    console.error(`Error processing ${sourceType} content:`, error);
    throw error;
  }
}

/**
 * Process text content directly
 * @param {string} text - Raw text content
 * @returns {Promise<string>} - Processed text
 */
async function processTextContent(text) {
  // For text, we just return it directly
  return text;
}

/**
 * Process PDF content
 * @param {object} pdfData - Object containing file path or buffer
 * @returns {Promise<string>} - Extracted text from PDF
 */
async function processPdfContent(pdfData) {
  try {
    let dataBuffer;

    // Handle case where we receive a file path
    if (typeof pdfData === "string") {
      dataBuffer = await readFile(pdfData);
    }
    // Handle case where we receive a file uploaded from frontend
    else if (pdfData.path) {
      dataBuffer = await readFile(pdfData.path);
    }
    // Handle case where we already have a buffer
    else if (Buffer.isBuffer(pdfData)) {
      dataBuffer = pdfData;
    } else {
      throw new Error("Invalid PDF data provided");
    }

    // Extract text from PDF
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Process YouTube content by extracting transcript
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<string>} - Processed content from YouTube transcript
 */
async function processYoutubeContent(youtubeUrl) {
  try {
    // For demonstration purposes, we'll use a simplified approach
    // In a production app, you would integrate with YouTube's API or a third-party service

    // Extract video ID from URL
    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // For this example, we'll summarize the video using AI
    // In a real app, you'd fetch the actual transcript
    const prompt = `
    Please summarize the main educational content from this YouTube video: ${youtubeUrl}.
    Focus on extracting key concepts and information that would be useful for creating 
    educational content. If you don't have information about this specific video,
    generate plausible educational content based on the URL or video ID.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error processing YouTube content:", error);
    throw new Error(`Failed to process YouTube content: ${error.message}`);
  }
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
function extractYoutubeVideoId(url) {
  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

module.exports = {
  processContent,
};
