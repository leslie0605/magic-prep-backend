// Simple test script for youtube-transcript package

const { YoutubeTranscript } = require("youtube-transcript");

async function testTranscript() {
  try {
    console.log("Testing youtube-transcript package...");

    // Log the YoutubeTranscript class to understand it
    console.log("YoutubeTranscript:", YoutubeTranscript);

    // Create instance of the YoutubeTranscript class
    const transcriptApi = new YoutubeTranscript();

    // Log the instance methods
    console.log(
      "transcriptApi methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(transcriptApi))
    );

    // Example video ID
    const videoId = "dQw4w9WgXcQ"; // Rick Astley

    console.log(`Attempting to get transcript for video ID: ${videoId}`);

    // Try each available method to see which one works
    if (typeof transcriptApi.fetchTranscript === "function") {
      console.log("Using fetchTranscript method...");
      const transcript = await transcriptApi.fetchTranscript(videoId);
      console.log("Transcript:", transcript.slice(0, 2));
    } else if (typeof transcriptApi.getTranscript === "function") {
      console.log("Using getTranscript method...");
      const transcript = await transcriptApi.getTranscript(videoId);
      console.log("Transcript:", transcript.slice(0, 2));
    } else if (typeof transcriptApi.get === "function") {
      console.log("Using get method...");
      const transcript = await transcriptApi.get(videoId);
      console.log("Transcript:", transcript.slice(0, 2));
    } else if (typeof transcriptApi.retrieve === "function") {
      console.log("Using retrieve method...");
      const transcript = await transcriptApi.retrieve(videoId);
      console.log("Transcript:", transcript.slice(0, 2));
    } else {
      console.log(
        "No supported methods found. Available methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(transcriptApi))
      );

      // Try static methods if they exist
      if (typeof YoutubeTranscript.fetchTranscript === "function") {
        console.log("Using static fetchTranscript method...");
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        console.log("Transcript:", transcript.slice(0, 2));
      } else {
        console.log(
          "No static methods found. Available static methods:",
          Object.getOwnPropertyNames(YoutubeTranscript)
        );
      }
    }
  } catch (error) {
    console.error("Error testing transcript:", error);
  }
}

// Run the test
testTranscript();
