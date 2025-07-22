require('dotenv/config');
const inquirer = require('inquirer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('./services/notionService');
const { getCalendarEvents } = require('./services/calendarService');

async function generateDailyBriefing() {
  try {
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

    // Construct the detailed text prompt
    let briefingPrompt = "Daily Briefing:\n\n";

    briefingPrompt += "Annual Goals:\n";
    if (annualGoals.length > 0) {
      annualGoals.forEach(goal => {
        const title = goal.properties?.Goal?.title?.[0]?.plain_text || 'Untitled';
        briefingPrompt += `- ${title}\n`;
      });
    } else {
      briefingPrompt += "No annual goals found.\n";
    }
    briefingPrompt += "\n";

    briefingPrompt += "Quarterly Goals:\n";
    if (quarterlyGoals.length > 0) {
      quarterlyGoals.forEach(goal => {
        const title = goal.properties?.Goal?.title?.[0]?.plain_text || 'Untitled';
        briefingPrompt += `- ${title}\n`;
      });
    } else {
      briefingPrompt += "No quarterly goals found.\n";
    }
    briefingPrompt += "\n";

    briefingPrompt += "Weekly Goals:\n";
    if (weeklyGoals.length > 0) {
      weeklyGoals.forEach(goal => {
        const title = goal.properties?.Goal?.title?.[0]?.plain_text || 'Untitled';
        briefingPrompt += `- ${title}\n`;
      });
    } else {
      briefingPrompt += "No weekly goals found.\n";
    }
    briefingPrompt += "\n";

    briefingPrompt += "Daily Tasks:\n";
    if (dailyTasks.length > 0) {
      dailyTasks.forEach(task => {
        const title = task.properties?.Name?.title?.[0]?.plain_text || 'Untitled';
        briefingPrompt += `- ${title}\n`;
      });
    } else {
      briefingPrompt += "No daily tasks found.\n";
    }
    briefingPrompt += "\n";

    briefingPrompt += "Calendar Events Today:\n";
    if (calendarEvents.length > 0) {
      calendarEvents.forEach(event => {
        const startTime = event.start && (event.start.dateTime || event.start.date);
        const formattedTime = startTime ? new Date(startTime).toLocaleString() : 'N/A';
        briefingPrompt += `- ${event.summary} (Start: ${formattedTime})\n`;
      });
    } else {
      briefingPrompt += "No calendar events today.\n";
    }
    briefingPrompt += "\n";

    briefingPrompt += "Additional Notes:\n";
    briefingPrompt += `${answers.manualAdditions || 'No additional notes.'}\n`;

    // Initialize Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Send the prompt to the Generative AI model
    const result = await model.generateContent(briefingPrompt);
    const response = await result.response;
    const text = response.text();

    // Log the AI's response to the console
    console.log("\n--- AI Generated Daily Briefing ---\n");
    console.log(text);

  } catch (error) {
    console.error('An error occurred during briefing generation:', error);
  }
}

generateDailyBriefing();