// This service is responsible for fetching events from the Google Calendar API.

// Load environment variables from a .env file.
require('dotenv').config();
// Import necessary Node.js and Google library modules.
const fs = require('fs').promises; // For asynchronous file system operations.
const { google } = require('googleapis'); // The main Google APIs client library.

/**
 * Authorizes the application to make Google Calendar API calls.
 * This is a non-interactive flow that relies on `credentials.json` and a pre-existing `token.json`.
 * The `token.json` file must be generated first by running the `authorize.js` script.
 * @returns {Promise<OAuth2Client>} An authorized OAuth2 client instance.
 */
async function authorize() {
  // Read the application's credentials from the credentials file.
  const credentialsContent = await fs.readFile('credentials.json');
  const credentials = JSON.parse(credentialsContent);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  // Create a new OAuth2 client with the loaded credentials.
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Read the user's previously saved token.
  const tokenContent = await fs.readFile('token.json');
  const token = JSON.parse(tokenContent);

  // Set the credentials for the OAuth2 client, including the access and refresh tokens.
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Fetches all calendar events scheduled for the current day.
 * @returns {Promise<Array>} A promise that resolves to an array of event objects.
 */
async function getCalendarEvents() {
  try {
    // Get an authorized client before making any API calls.
    const auth = await authorize();
    // Create a new Google Calendar API client.
    const calendar = google.calendar({ version: 'v3', auth });

    // Calculate the time range for today (from midnight to midnight).
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Get the specific Calendar ID from environment variables.
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable is not set.');
    }

    // Call the Google Calendar API to list events within the specified time range.
    const res = await calendar.events.list({
      calendarId: calendarId,
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true, // Expands recurring events into individual instances.
      orderBy: 'startTime', // Sorts events by their start time.
    });

    // Extract the list of events from the API response.
    const events = res.data.items;
    // Return the events, or an empty array if there are none.
    return events || [];
  } catch (error) {
    // Log any errors that occur during the process and re-throw the error.
    console.error('Error fetching calendar events:', error.message);
    throw error;
  }
}

// Export the main function so it can be used by other parts of the application (e.g., index.js).
module.exports = { getCalendarEvents };