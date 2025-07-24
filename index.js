// 1. Define all imports
// Load environment variables from a .env file.
require('dotenv/config');

// Import inquirer for interactive command-line prompts.
const inquirer = require('inquirer');

// Import the Google AI client library.
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import data-fetching functions from local service modules.
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('./services/notionService');
const { getCalendarEvents } = require('./services/calendarService');

// Import Node.js built-in modules for file system and path handling.
const fs = require('fs').promises;
const path = require('path');

// 2. Define the loadContextualData function
/**
 * Reads all files from the /context directory and combines them into a single string.
 * This provides the AI with foundational knowledge about the user and their goals.
 * @returns {Promise<string>} A string containing all context data, separated by '---'.
 */
async function loadContextualData() {
  const contextDir = path.join(__dirname, 'context');
  let combinedContext = '';
  try {
    const files = await fs.readdir(contextDir);
    for (const file of files) {
      const filePath = path.join(contextDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      combinedContext += content + '\n---\n';
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('Context directory not found. Proceeding without contextual data.');
      return '';
    } else {
      throw error;
    }
  }
  return combinedContext;
}

// 3. Define the main generateDailyBriefing async function
/**
 * Orchestrates the entire daily briefing generation process.
 */
async function generateDailyBriefing() {
  try {
    // Step 3a: Data Gathering
    // Display a message to the user while data is being fetched.
    console.log("Gathering your data...");
    // Use Promise.all to fetch all data sources concurrently for better performance.
    const [
      contextualData,
      annualGoals,
      quarterlyGoals,
      weeklyGoals,
      dailyTasks,
      calendarEvents
    ] = await Promise.all([
      loadContextualData(),
      getAnnualGoals(),
      getQuarterlyGoals(),
      getWeeklyGoals(),
      getDailyTasks(),
      getCalendarEvents()
    ]);

    // Step 3b: Initial Prompt Construction
    // Use a template literal to build a clean, multi-line string for the initial AI prompt.
    // This prompt includes all the data fetched in the previous step.
    const initialPrompt = `
## My Personal Context & Directives
${contextualData}

## Daily Briefing Data
Annual Goals: ${annualGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Quarterly Goals: ${quarterlyGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Weekly Goals: ${weeklyGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Daily Tasks: ${dailyTasks.map(t => t.properties?.Name?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Calendar Events Today: ${calendarEvents.map(e => `${e.summary} (Start: ${new Date(e.start?.dateTime || e.start?.date).toLocaleString()})`).join(', ')}
`;

    // Step 3c: AI Initialization
    // Instantiate the main GoogleGenerativeAI client with the API key from the .env file.
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Select the specific AI model to be used for generation.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Step 3d: First Briefing Generation
    // Start a new chat session with the model. The history is pre-filled with the comprehensive initial prompt.
    // This gives the AI all the context it needs for the entire conversation.
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: initialPrompt }] },
        { role: "model", parts: [{ text: "Okay, I have all the context. Ready for your command." }] },
      ],
    });

    // Inform the user that the initial briefing is being generated.
    console.log("Generating your initial daily briefing...");
    // Send the first conversational message to the AI to trigger the briefing generation.
    const result = await chat.sendMessage("Based on all the context I have provided, here is your initial daily briefing now.");
    // Await the AI's response from the sendMessage call.
    const response = await result.response;
    // Print the full text content of the AI's response to the console.
    console.log(response.text());

    // Step 3e: Conversational Loop
    // Inform the user that the interactive conversation can begin.
    console.log("--- Conversation Started ---");
    // Start an infinite loop to allow for a continuous back-and-forth conversation.
    while (true) {
      // Use inquirer to prompt the user for their next message.
      const userInput = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: '> ',
        },
      ]);

      // Extract the user's message and remove any leading/trailing whitespace.
      const userMessage = userInput.message.trim();

      // Check for 'exit' or 'quit' commands to terminate the loop.
      if (userMessage.toLowerCase() === 'exit' || userMessage.toLowerCase() === 'quit') {
        console.log("Ending conversation. Goodbye!");
        break; // Exit the while loop.
      }

      // Send the user's message to the ongoing chat session.
      const loopResult = await chat.sendMessage(userMessage);
      // Await the AI's response.
      const loopResponse = await loopResult.response;
      // Print the AI's response text to the console.
      console.log(loopResponse.text());
    }

  } catch (error) {
    // Catch and log any errors that occur during the entire process.
    console.error('An error occurred during briefing generation:', error);
  }
}

// 4. Define the final execution call
// Call the main function to start the application.
generateDailyBriefing();