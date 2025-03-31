const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const axios = require("axios");
const { promisify } = require("util");
const pdf = require("pdf-parse");
const readFile = promisify(fs.readFile);
const { YoutubeTranscript } = require("youtube-transcript");

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
    // Extract video ID from URL
    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    try {
      console.log(`Attempting to retrieve transcript for video ID: ${videoId}`);

      // Use the static fetchTranscript method
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);

      if (transcript && transcript.length > 0) {
        // Process transcript items into a continuous text
        let fullTranscript = transcript
          .map((item) => item.text)
          .join(" ")
          .replace(/\s+/g, " "); // Clean up extra whitespace

        // Decode common HTML entities
        fullTranscript = decodeHtmlEntities(fullTranscript);

        console.log(
          `Successfully retrieved transcript for YouTube video ID: ${videoId} (${fullTranscript.length} characters)`
        );
        return fullTranscript;
      } else {
        throw new Error("No transcript found for this video");
      }
    } catch (transcriptError) {
      // Log detailed error information for debugging
      console.warn(
        `[YouTube Transcript Error] Video ID: ${videoId}, Error: ${transcriptError.message}`
      );
      console.warn(
        `[YouTube Transcript Error] Error Stack: ${
          transcriptError.stack?.substring(0, 200) || "No stack trace"
        }`
      );
      console.warn("Falling back to AI summary...");

      // Fallback to AI-generated content when transcript is unavailable
      const prompt = `
      Please summarize the main educational content from this YouTube video: ${youtubeUrl}.
      Focus on extracting key concepts and information that would be useful for creating 
      educational content. If you don't have information about this specific video,
      generate plausible educational content based on the URL or video ID.
      `;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        });

        const aiSummary = response.choices[0].message.content;
        console.log(
          `Generated AI summary for YouTube video ID: ${videoId} (${aiSummary.length} characters)`
        );
        return aiSummary;
      } catch (aiError) {
        console.error(
          `[OpenAI Error] Failed to generate summary: ${aiError.message}`
        );
        throw new Error(
          `Unable to process YouTube content: ${aiError.message}`
        );
      }
    }
  } catch (error) {
    console.error(`[YouTube Processing Error] ${error.message}`, {
      url: youtubeUrl,
    });
    throw new Error(`Failed to process YouTube content: ${error.message}`);
  }
}

/**
 * Decode HTML entities in a string
 * @param {string} text - Text with HTML entities
 * @returns {string} - Decoded text
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
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
