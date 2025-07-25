// 1. Define all imports
// Load environment variables from a .env file.
require('dotenv/config');

// Import the Google AI client library.
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import data-fetching functions from local service modules.
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('./services/notionService');
const { getCalendarEvents } = require('./services/calendarService');

// Import Node.js built-in modules for file system and path handling.
const fs = require('fs').promises;
const path = require('path');
const express = require('express');

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

async function getBriefingPrompt() {
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
    let initialPrompt = `
## My Personal Context & Directives
${contextualData}

## Daily Briefing Data
Annual Goals: ${annualGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Quarterly Goals: ${quarterlyGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Weekly Goals: ${weeklyGoals.map(g => g.properties?.Goal?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Daily Tasks: ${dailyTasks.map(t => t.properties?.Name?.title?.[0]?.plain_text || 'Untitled').join(', ')}
Calendar Events Today: ${calendarEvents.map(e => `${e.summary} (Start: ${new Date(e.start?.dateTime || e.start?.date).toLocaleString()})`).join(', ')}
`;
    return initialPrompt;
}

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/api/briefing', async (req, res) => {
  try {
    const initialPrompt = await getBriefingPrompt();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(initialPrompt);
    const response = await result.response;
    
    res.json({ briefing: response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate briefing.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});