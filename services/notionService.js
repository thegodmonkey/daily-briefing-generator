// Load environment variables from .env file
require('dotenv').config();

// Import the Notion SDK client
const { Client } = require('@notionhq/client');

// Initialize a new Notion client with the API key from environment variables
const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Fetches all pages from the 'Annual Goals' Notion database.
 * The database ID is read from the NOTION_ANNUAL_GOALS_DB_ID environment variable.
 * @returns {Promise<Array>} A promise that resolves to an array of Notion page objects.
 */
async function getAnnualGoals() {
  const databaseId = process.env.NOTION_ANNUAL_GOALS_DB_ID;
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results;
}

/**
 * Fetches all pages from the 'Quarterly Goals' Notion database.
 * The database ID is read from the NOTION_QUARTERLY_GOALS_DB_ID environment variable.
 * @returns {Promise<Array>} A promise that resolves to an array of Notion page objects.
 */
async function getQuarterlyGoals() {
  const databaseId = process.env.NOTION_QUARTERLY_GOALS_DB_ID;
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results;
}

/**
 * Fetches all pages from the 'Weekly Goals' Notion database.
 * The database ID is read from the NOTION_WEEKLY_GOALS_DB_ID environment variable.
 * @returns {Promise<Array>} A promise that resolves to an array of Notion page objects.
 */
async function getWeeklyGoals() {
  const databaseId = process.env.NOTION_WEEKLY_GOALS_DB_ID;
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  return response.results;
}

/**
 * Fetches pages from the 'Daily Planner' Notion database.
 * Filters entries where the 'Date' property is either yesterday or today.
 * The database ID is read from the NOTION_DAILY_PLANNER_DB_ID environment variable.
 * @returns {Promise<Array>} A promise that resolves to an array of Notion page objects.
 */
async function getDailyTasks() {
  const databaseId = process.env.NOTION_DAILY_PLANNER_DB_ID;

  // Calculate yesterday's and today's dates for filtering
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const today = new Date();

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      or: [
        {
          property: 'Date',
          date: {
            equals: yesterday.toISOString().split('T')[0],
          },
        },
        {
          property: 'Date',
          date: {
            equals: today.toISOString().split('T')[0],
          },
        },
      ],
    },
  });
  return response.results;
}

// Export all functions for use in other modules
module.exports = {
  getAnnualGoals,
  getQuarterlyGoals,
  getWeeklyGoals,
  getDailyTasks,
};
