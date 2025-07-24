require('dotenv/config');
const inquirer = require('inquirer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('./services/notionService');
const { getCalendarEvents } = require('./services/calendarService');
const fs = require('fs').promises;
const path = require('path');

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

async function generateDailyBriefing() {
  try {
    const contextualData = await loadContextualData();

    // Fetch data concurrently from all services
    const [annualGoals, quarterlyGoals, weeklyGoals, dailyTasks, calendarEvents] = await Promise.all([
      getAnnualGoals(),
      getQuarterlyGoals(),
      getWeeklyGoals(),
      getDailyTasks(),
      getCalendarEvents()
    ]);

    // Ask the user for additional notes
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'manualAdditions',
        message: 'What else is on your mind for today? (e.g., unplanned tasks, workouts, or notes)',
      },
    ]);

    // Construct the initial prompt with all gathered data
    let initialPrompt = "## My Personal Context & Directives\n" + contextualData + "\n";
    initialPrompt += "Daily Briefing Data:\n\n";

    initialPrompt += "Annual Goals:\n";
    if (annualGoals.length > 0) {
      annualGoals.forEach(goal => {
        const title = goal.properties?.Goal?.title?.[0]?.plain_text || 'Untitled';
        initialPrompt += `- ${title}\n`;
      });
    } else {
      initialPrompt += "No annual goals found.\n";
    }
    initialPrompt += "\n";

    initialPrompt += "Quarterly Goals:\n";
    if (quarterlyGoals.length > 0) {
      quarterlyGoals.forEach(goal => {
        const title = goal.properties?.Goal?.title?.[0]?.plain_text || 'Untitled';
        initialPrompt += `- ${title}\n`;
      });
    } else {
      initialPrompt += "No quarterly goals found.\n";
    }
    initialPrompt += "\n";

    initialPrompt += "Weekly Goals:\n";
    if (weeklyGoals.length > 0) {
      weeklyGoals.forEach(goal => {
        const title = goal.properties?.Goal?.title?.[0]?.plain_text || 'Untitled';
        initialPrompt += `- ${title}\n`;
      });
    } else {
      initialPrompt += "No weekly goals found.\n";
    }
    initialPrompt += "\n";

    initialPrompt += "Daily Tasks:\n";
    if (dailyTasks.length > 0) {
      dailyTasks.forEach(task => {
        const title = task.properties?.Name?.title?.[0]?.plain_text || 'Untitled';
        initialPrompt += `- ${title}\n`;
      });
    } else {
      initialPrompt += "No daily tasks found.\n";
    }
    initialPrompt += "\n";

    initialPrompt += "Calendar Events Today:\n";
    if (calendarEvents.length > 0) {
      calendarEvents.forEach(event => {
        const startTime = event.start && (event.start.dateTime || event.start.date);
        const formattedTime = startTime ? new Date(startTime).toLocaleString() : 'N/A';
        initialPrompt += `- ${event.summary} (Start: ${formattedTime})\n`;
      });
    } else {
      initialPrompt += "No calendar events today.\n";
    }
    initialPrompt += "\n";

    initialPrompt += "Additional Notes:\n";
    initialPrompt += `${answers.manualAdditions || 'No additional notes.'}\n`;

    // Initialize Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Start a new chat session
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: initialPrompt }] },
        { role: "model", parts: [{ text: "Okay, I have all the context. How can I help you today?" }] },
      ],
      generationConfig: {
        maxOutputTokens: 2000,
      },
    });

    console.log("\n--- Daily Briefing Generator CLI ---\n");
    console.log("Type 'exit' or 'quit' to end the conversation.\n");

    // Send the initial briefing request
    let result = await chat.sendMessage("Please provide my daily briefing now.");
    let response = await result.response;
    console.log(response.text());

    // Start the conversational loop
    while (true) {
      const userInput = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: '> ',
        },
      ]);

      const userMessage = userInput.message.trim();

      if (userMessage.toLowerCase() === 'exit' || userMessage.toLowerCase() === 'quit') {
        console.log("Ending conversation. Goodbye!");
        break;
      }

      result = await chat.sendMessage(userMessage);
      response = await result.response;
      console.log(response.text());
    }

  } catch (error) {
    console.error('An error occurred during briefing generation:', error);
  }
}

generateDailyBriefing();