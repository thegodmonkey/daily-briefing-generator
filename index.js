/**
 * @file index.js
 * @description This is the main entry point for the Daily Briefing application.
 * It sets up an Express.js server to handle API requests and serves the frontend.
 * It orchestrates data fetching from Notion and Google Calendar, prepares a prompt
 * for the Google Gemini API, and manages the conversation history with the AI.
 */

// --- 1. IMPORTS AND SETUP ---

// Load environment variables from the .env file into process.env.
// This allows the application to access sensitive information like API keys
// without hardcoding them directly into the source code.
require('dotenv/config');

// Import third-party libraries.
// GoogleGenerativeAI: The official client library for interacting with the Gemini API.
const { GoogleGenerativeAI } = require('@google/generative-ai');
// express: A fast, unopinionated, minimalist web framework for Node.js,
// used here to create the HTTP server and handle routes.
const express = require('express');

// Import local service modules for fetching data from Notion and Google Calendar.
// These modules encapsulate the logic for interacting with external APIs.
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('./services/notionService');
const { getCalendarEvents } = require('./services/calendarService');

// Import Node.js built-in modules.
// fs.promises: Provides asynchronous file system methods, used here for reading context files.
const fs = require('fs').promises;
// path: Provides utilities for working with file and directory paths, used for constructing absolute paths.
const path = require('path');

// --- 2. DATA LOADING AND PROMPT PREPARATION ---

/**
 * Reads all files from the /context directory and combines their content.
 * This data provides the AI with foundational, long-term context about the user's
 * preferences, goals, and other relevant information. This helps the AI generate
 * more personalized and accurate briefings.
 * @returns {Promise<string>} A single string containing all contextual data,
 *                            separated by '---' for clear distinction between files.
 */
async function loadContextualData() {
  // Construct the absolute path to the 'context' directory.
  const contextDir = path.join(__dirname, 'context');
  let combinedContext = '';
  try {
    // Read the names of all files within the context directory.
    const files = await fs.readdir(contextDir);
    // Loop through each file in the context directory.
    for (const file of files) {
      const filePath = path.join(contextDir, file);
      // Read the content of each file as UTF-8 encoded text.
      const content = await fs.readFile(filePath, 'utf8');
      // Append the file content to the combined string, followed by a separator.
      // The separator helps the AI distinguish between different context documents.
      combinedContext += content + '\n---\n';
    }
  } catch (error) {
    // If the context directory doesn't exist (e.g., it's optional or not yet created),
    // log a warning but allow the application to continue without contextual data.
    if (error.code === 'ENOENT') {
      console.warn('Context directory not found. Proceeding without contextual data.');
      return ''; // Return an empty string if the directory is not found.
    } else {
      // For any other unexpected errors during file reading, re-throw them
      // to be handled by the calling function or a global error handler.
      throw error;
    }
  }
  return combinedContext;
}

/**
 * Gathers all necessary data from Notion (annual, quarterly, weekly goals, daily tasks),
 * Google Calendar (today's events), and local context files.
 * It then assembles this information into a single, comprehensive prompt string
 * that will be sent to the Gemini API for generating the daily briefing.
 * @returns {Promise<string>} The fully constructed prompt string, formatted with Markdown headings.
 * @throws {Error} If there is an issue gathering data from any source.
 */
async function getBriefingPrompt() {
    console.log("Gathering your data...");
    try {
        // Use Promise.all to fetch all data sources concurrently for better performance.
        // This allows all API calls and file reads to happen in parallel.
        const [
          contextualData,
          annualGoals,
          quarterlyGoals,
          weeklyGoals,
          dailyTasks,
          calendarEvents
        ] = await Promise.all([
          loadContextualData(),    // Load long-term context from local files.
          getAnnualGoals(),        // Fetch annual goals from Notion.
          getQuarterlyGoals(),     // Fetch quarterly goals from Notion.
          getWeeklyGoals(),        // Fetch weekly goals from Notion.
          getDailyTasks(),         // Fetch daily tasks from Notion.
          getCalendarEvents()      // Fetch today's events from Google Calendar.
        ]);

        // Construct the prompt using a template literal for clean, readable formatting.
        // This prompt is carefully structured with markdown headings to be easily parsed by the AI.
        // Each data point is mapped to extract relevant text and joined into a single string.
        let initialPrompt = `\n## My Personal Context & Directives\n${contextualData}\n\n## Daily Briefing Data\nAnnual Goals: ${annualGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}\nQuarterly Goals: ${quarterlyGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}\nWeekly Goals: ${weeklyGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}\nDaily Tasks: ${dailyTasks.map(t => t.properties?.Name?.title?.[0]?.plain_text || 'Untitled').join(', ')}\nCalendar Events Today: ${calendarEvents.map(e => `${e.summary} (Start: ${new Date(e.start?.dateTime || e.start?.date).toLocaleString()})`).join(', ')}\n`;
        return initialPrompt;
    } catch (error) {
        // Log any errors that occur during data gathering and re-throw a more generic error
        // to indicate that the briefing prompt could not be generated.
        console.error("Error gathering data for briefing prompt:", error);
        throw new Error("Failed to gather data for the briefing prompt.");
    }
}

// --- 3. EXPRESS SERVER SETUP ---

// Create a new Express application instance.
const app = express();
// Define the port number on which the server will listen for incoming requests.
const port = 3000;

// Serve all static files (like index.html, script.js, and CSS files) from the 'public' directory.
// This middleware makes files in 'public' accessible directly via the web server.
app.use(express.static('public'));
// Enable JSON body parsing for incoming requests.
// This middleware automatically parses JSON payloads in request bodies,
// making them available on `req.body`.
app.use(express.json());

// Define the main API endpoint for generating the briefing.
// This route handles POST requests to '/api/briefing'.
app.post('/api/briefing', async (req, res) => {
  try {
    // Extract 'history' (previous conversation turns) and 'message' (current user input)
    // from the request body sent by the client.
    const { history, message } = req.body;
    // Initialize chatHistory with the provided history, or an empty array if none is provided.
    let chatHistory = history || [];
    // The prompt for the Gemini API will be the current user message by default.
    let prompt = message;

    // This conditional logic handles the initial prompt and ensures valid conversation history
    // for the Gemini API, which expects conversations to start with a 'user' role.
    // If the history starts with a 'model' role, it means the client might have sent
    // an incomplete history or it's the second turn where the initial briefing needs to be prepended.
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      // In this scenario, we need to re-generate the initial briefing prompt
      // and prepend it as a 'user' message to make the history valid for the Gemini API.
      const initialPrompt = await getBriefingPrompt();
      chatHistory.unshift({ role: 'user', parts: [{ text: initialPrompt }] });
    } else if (chatHistory.length === 0) {
      // If this is the very first message in the conversation (history is empty),
      // the prompt should be the comprehensive initial briefing generated from all data sources.
      prompt = await getBriefingPrompt();
    }
    
    // Initialize the Google Generative AI client with the API key from environment variables.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Get the generative model instance, specifying the model name from environment variables.
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

    // Start a chat session with the Gemini model, providing the (potentially modified) conversation history.
    // This allows the AI to maintain context across turns.
    const chat = model.startChat({ history: chatHistory });
    // Send the current prompt (either the initial briefing or the user's message) to the AI.
    const result = await chat.sendMessage(prompt);
    // Await the AI's response.
    const response = await result.response;
    
    // Send the generated text from the AI back to the client as a JSON object.
    // The client will then display this briefing/response.
    res.json({ briefing: response.text() });
  } catch (error) {
    // If any error occurs during the API request or data processing,
    // log it to the console for debugging and send a 500 server error response
    // to the client, indicating a failure to generate the briefing.
    console.error(error);
    res.status(500).json({ error: 'Failed to generate briefing.' });
  }
});

// Start the Express server and listen for incoming requests on the specified port.
// Once the server is running, a message is logged to the console indicating its URL.
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});