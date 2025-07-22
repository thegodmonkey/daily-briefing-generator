# Project: Daily Briefing Generator

A command-line tool built with Node.js to fetch data from Notion and Google Calendar and generate a daily briefing using the Google Gemini API.

## Core Development Principles
* **Intentional Code:** Confirm the goal before generating or modifying code. Avoid adding code that wasn't explicitly requested.
* **High-Quality Code:** All generated code must be clean, follow modern best practices, and include clear, concise comments explaining the logic.
* **Test As We Build:** All new functionality must be verified with a test immediately after it is created.

## Key Files & Directories

* `index.js`: The main application entry point. Orchestrates calls to Notion, Google Calendar, and the Gemini API to generate the daily briefing.
* `package.json`: Manages project dependencies, including `express`, `@notionhq/client`, `googleapis`, `dotenv`, and `@google/generative-ai`.
* `/services`: Contains modules for connecting to third-party APIs.
* `/tests`: Contains scripts for testing individual services (`test-notion.js`, `test-calendar.js`, `test-gemini.js`, etc.).

## Core Services (`/services`)

### `notionService.js`
* Uses the `@notionhq/client` library.
* Authenticates using an API key from `.env`.
* Reads database IDs from `.env`.
* **Functions:**
    * `getAnnualGoals()`
    * `getQuarterlyGoals()`
    * `getWeeklyGoals()`
    * `getDailyTasks()` (Filters for yesterday and today)

### `calendarService.js`
* Uses the `googleapis` library.
* Authenticates using OAuth 2.0 (`credentials.json` and `token.json`).
* Reads the calendar ID from `.env`.
* **Functions:**
    * `getCalendarEvents()` (Fetches events for today)

### Gemini API Integration
* Uses the `@google/generative-ai` library.
* Authenticates using an API key from `.env` (`GEMINI_API_KEY`).
* Integrated directly into `index.js` to send the combined briefing prompt to the `gemini-2.5-flash` model.

## Configuration

* `.env`: Stores all secret keys and IDs for Notion, Google Calendar, and the Gemini API. Loaded using `dotenv`.
* `credentials.json`: The OAuth 2.0 client configuration file downloaded from Google Cloud.
