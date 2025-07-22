console.log('Starting calendar test...');
// Import the getCalendarEvents function from the calendar service.
const { getCalendarEvents } = require('../services/calendarService');

/**
 * Runs a test for the calendar integration.
 * It fetches calendar events and logs them to the console for manual review.
 */
async function runTest() {
  try {
    console.log('\n--- Running Calendar Integration Test ---\n');

    // Fetch calendar events using the getCalendarEvents function.
    const events = await getCalendarEvents();

    // Check if any events were found.
    if (events.length === 0) {
      console.log("No events found for today.");
    } else {
      // If events are found, log a header and then iterate through each event.
      console.log('Calendar Events:');
      events.forEach(event => {
        const startTime = event.start && (event.start.dateTime || event.start.date);
        if (startTime) {
          // Log the event summary and formatted start time.
          console.log(`- ${event.summary} (Start: ${new Date(startTime).toLocaleString()})`);
        } else {
          console.warn(`- Skipping event with missing start time: ${event.summary}`);
        }
      });
    }
    console.log('\n--- Calendar Test Complete ---\n');
  } catch (error) {
    // Catch and log any errors that occur during the test execution.
    console.error('❌ An error occurred during the calendar test:', error);
  }
}

// Export the runTest function for use by a test runner.
module.exports = runTest;

// If this script is executed directly, run the test
if (require.main === module) {
  runTest();
}