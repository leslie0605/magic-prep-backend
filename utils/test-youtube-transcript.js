// Script to test the YouTube transcript functionality

const { processContent } = require("./contentProcessor");
require("dotenv").config({ path: "../.env" });

// Test function
async function testYoutubeTranscript() {
  try {
    // Array of test cases with different videos
    const testCases = [
      {
        name: "Popular video with captions",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Astley - Never Gonna Give You Up
      },
      {
        name: "Educational/instructional video",
        url: "https://www.youtube.com/watch?v=zNk4-hElZ1M", // Khan Academy intro to Neural Networks
      },
    ];

    console.log("===== TESTING YOUTUBE TRANSCRIPT EXTRACTION =====\n");

    // Test each case
    for (const testCase of testCases) {
      console.log(`\n----- Test Case: ${testCase.name} -----`);
      console.log(`URL: ${testCase.url}`);

      try {
        const startTime = Date.now();
        const transcript = await processContent("youtube", testCase.url);
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`Success! Retrieved in ${elapsedTime} seconds`);
        console.log(`Transcript Preview (first 200 characters):`);
        console.log(`"${transcript.substring(0, 200)}..."`);
        console.log(`Total transcript length: ${transcript.length} characters`);
      } catch (error) {
        console.error(`Failed: ${error.message}`);
      }
    }

    console.log("\n===== TESTING COMPLETE =====");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Run the test
testYoutubeTranscript();
