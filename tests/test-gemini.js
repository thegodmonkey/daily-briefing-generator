require('dotenv/config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function runTest() {
  try {
    // Initialize Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Send a simple prompt
    const prompt = "Hello! If you can see this, respond with a single sentence.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Log the AI's response
    console.log("Gemini API Test Response:");
    console.log(text);

  } catch (error) {
    console.error('Error testing Gemini API:', error);
  }
}

// Export the runTest function for use in other modules
module.exports = runTest;