// This script serves as a central test runner for all integration tests.

// Import individual test modules
const runNotionTest = require('./tests/test-all-notion');
const runCalendarTest = require('./tests/test-calendar');
const runGeminiTest = require('./tests/test-gemini');

/**
 * Executes all defined integration tests sequentially.
 * Logs the start and completion of the test suite.
 */
async function runAllTests() {
  console.log('Starting all tests...');

  // Run the Notion integration test
  await runNotionTest();

  // Run the Calendar integration test
  await runCalendarTest();

  // Run the Gemini integration test
  await runGeminiTest();

  console.log('All tests finished.');
}

// Execute the main test runner function
runAllTests();
