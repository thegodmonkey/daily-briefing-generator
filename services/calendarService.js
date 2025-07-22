require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { google } = require('googleapis');
const readline = require('readline');

// Define the scope for Google Calendar API (read-only)
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Define the full, correct paths for the token and credentials files
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Loads a saved token from token.json if it exists.
 * @returns {Promise<object|null>}
 */
async function loadTokenIfExists() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    return JSON.parse(content);
  } catch (err) {
    // If the file doesn't exist or is invalid, return null.
    return null;
  }
}

/**
 * Saves a new token to token.json.
 * @param {object} token The token to save.
 * @returns {Promise<void>}
 */
async function saveToken(token) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token saved to', TOKEN_PATH);
}

/**
 * The single main authorization function.
 * It first tries to load a token. If that fails, it initiates the
 * one-time browser authorization flow and saves the new token.
 * @returns {Promise<import('google-auth-library').OAuth2Client>}
 */
async function authorize() {
  // Try to load a saved token
  const savedToken = await loadTokenIfExists();
  const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // If a token was loaded, set it and return the authorized client
  if (savedToken) {
    oAuth2Client.setCredentials(savedToken);
    return oAuth2Client;
  }

  // If no token exists, start the browser authorization flow
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
    console.log('Authorize this app by visiting this URL:', authUrl);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await saveToken(tokens);
        console.log('Authorization successful.');
        resolve(oAuth2Client);
      } catch (err) {
        console.error('Error while trying to retrieve access token', err);
        reject(err);
      }
    });
  });
}

/**
 * Fetches calendar events for the current day using the main authorize function.
 * @returns {Promise<Array>}
 */
async function getCalendarEvents() {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable is not set.');
    }

    const res = await calendar.events.list({
      calendarId: calendarId,
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items;
    return events || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error.message);
    throw error;
  }
}

module.exports = { getCalendarEvents };
