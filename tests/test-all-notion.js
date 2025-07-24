// Load environment variables from .env file
require('dotenv/config');

// Import Notion service functions
const { getAnnualGoals, getQuarterlyGoals, getWeeklyGoals, getDailyTasks } = require('../services/notionService.js');

/**
 * Runs a resilient test for Notion integration.
 * It fetches data from all four Notion databases concurrently and verifies that each returns an array.
 */
async function runTest() {
  try {
    console.log('\n--- Running Resilient Notion Integration Test ---\n');

    // Fetch all data concurrently
    const [annualGoals, quarterlyGoals, weeklyGoals, dailyTasks] = await Promise.all([
      getAnnualGoals(),
      getQuarterlyGoals(),
      getWeeklyGoals(),
      getDailyTasks(),
    ]);

    // Verify that all results are arrays
    if (!Array.isArray(annualGoals)) {
      throw new Error('Annual Goals did not return an array.');
    }
    if (!Array.isArray(quarterlyGoals)) {
      throw new Error('Quarterly Goals did not return an array.');
    }
    if (!Array.isArray(weeklyGoals)) {
      throw new Error('Weekly Goals did not return an array.');
    }
    if (!Array.isArray(dailyTasks)) {
      throw new Error('Daily Tasks did not return an array.');
    }

    console.log('✅ Notion test passed: All four databases returned data.');

  } catch (error) {
    console.error('❌ Notion test failed:', error.message);
  }
}

// Export the runTest function for use by a test runner
module.exports = runTest;

// If this script is executed directly, run the test
if (require.main === module) {
  runTest();
}