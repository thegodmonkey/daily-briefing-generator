const express = require('express');
const notionService = require('./services/notionService');

// Initialize the Express application
const app = express();
const port = 3000;

// Define a basic route for the root URL
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Define a route to fetch and display daily briefing data from Notion
app.get('/briefing', async (req, res) => {
  try {
    // Concurrently fetch data from all Notion databases
    const [annualGoals, quarterlyGoals, weeklyGoals, dailyTasks] = await Promise.all([
      notionService.getAnnualGoals(),
      notionService.getQuarterlyGoals(),
      notionService.getWeeklyGoals(),
      notionService.getDailyTasks(),
    ]);

    // Log the fetched data to the console for debugging purposes
    console.log('Annual Goals:', annualGoals);
    console.log('Quarterly Goals:', quarterlyGoals);
    console.log('Weekly Goals:', weeklyGoals);
    console.log('Daily Tasks:', dailyTasks);

    // Send the fetched data as a JSON response
    res.json({
      annualGoals,
      quarterlyGoals,
      weeklyGoals,
      dailyTasks,
    });
  } catch (error) {
    // Handle any errors during data fetching and send a 500 status code
    console.error(error);
    res.status(500).send("Error fetching data from Notion");
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});