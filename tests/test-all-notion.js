// Load environment variables from .env file
require('dotenv/config');

// Import Notion service functions
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('../services/notionService');

/**
 * Runs a comprehensive test for Notion integration.
 * It fetches data from various Notion databases and verifies if specific test items are present.
 */
async function runTest() {
  try {
    console.log('\n--- Running Notion Integration Test ---\n');

    // Initialize arrays to hold fetched data from each Notion database
    let annualGoals = [];
    let quarterlyGoals = [];
    let weeklyGoals = [];
    let dailyTasks = [];

    // Attempt to fetch Annual Goals and log success or failure
    try {
      annualGoals = await getAnnualGoals();
      console.log('✅ Annual Goals fetched successfully.');
      console.log('\n--- Annual Goals Titles ---');
      // Log titles of fetched annual goals, handling different property names
      if (annualGoals.length > 0) {
        annualGoals.forEach(item => {
          if (item.properties && item.properties.Goal && item.properties.Goal.title && item.properties.Goal.title[0]) {
            console.log(`- ${item.properties.Goal.title[0].plain_text}`);
          } else {
            console.log('- [Title not found or property structure different]');
          }
        });
      } else {
        console.log('- No annual goals found.');
      }
      console.log('---------------------------');
    } catch (error) {
      console.error('❌ Failed to fetch Annual Goals:', error.message);
    }

    // Attempt to fetch Quarterly Goals and log success or failure
    try {
      quarterlyGoals = await getQuarterlyGoals();
      console.log('✅ Quarterly Goals fetched successfully.');
    } catch (error) {
      console.error('❌ Failed to fetch Quarterly Goals:', error.message);
    }

    // Attempt to fetch Weekly Goals and log success or failure
    try {
      weeklyGoals = await getWeeklyGoals();
      console.log('✅ Weekly Goals fetched successfully.');
    } catch (error) {
      console.error('❌ Failed to fetch Weekly Goals:', error.message);
    }

    // Attempt to fetch Daily Tasks and log success or failure
    try {
      dailyTasks = await getDailyTasks();
      console.log('✅ Daily Tasks fetched successfully.');
    } catch (error) {
      console.error('❌ Failed to fetch Daily Tasks:', error.message);
    }

    // Combine all fetched results for overall title extraction
    const allResults = [
      ...annualGoals,
      ...quarterlyGoals,
      ...weeklyGoals,
      ...dailyTasks,
    ];

    // Extract titles from all results, checking for both 'Goal' and 'Name' properties
    const foundTitles = allResults.map(item => {
      if (item.properties && item.properties.Goal && item.properties.Goal.title && item.properties.Goal.title[0]) {
        return item.properties.Goal.title[0].plain_text;
      } else if (item.properties && item.properties.Name && item.properties.Name.title && item.properties.Name.title[0]) {
        return item.properties.Name.title[0].plain_text;
      }
      return null; // Return null if title property is not found in expected structures
    }).filter(title => title !== null); // Filter out null values

    console.log('\nTitles found in Notion databases (Overall):');
    foundTitles.forEach(title => console.log(`- ${title}`));
    console.log('');

    // Define the expected test titles
    const expectedTitles = [
      'TEST-ANNUAL-GOAL',
      'TEST-QUARTERLY-GOAL',
      'TEST-WEEKLY-GOAL',
      'TEST-DAILY-TASK',
    ];

    let allFound = true;
    const missingTitles = [];

    // Check if all expected titles are present in the found titles
    for (const expectedTitle of expectedTitles) {
      if (!foundTitles.includes(expectedTitle)) {
        allFound = false;
        missingTitles.push(expectedTitle);
      }
    }

    // Log the final test result (pass/fail) and missing items if any
    if (allFound) {
      console.log('✅ Test Passed: All 4 test items were found.');
    } else {
      console.log('❌ Test Failed: Could not find all test items.');
      console.log('Missing items:', missingTitles.join(', '));
    }

  } catch (error) {
    // Catch any unexpected errors during the test execution
    console.error('An unexpected error occurred during the test:', error);
    console.log('❌ Test Failed: An unexpected error occurred.');
  }
}

// Export the runTest function for use by a test runner
module.exports = runTest;

// If this script is executed directly, run the test
if (require.main === module) {
  runTest();
}
