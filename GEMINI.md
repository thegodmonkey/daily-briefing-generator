# Project: Daily Briefing Generator

A command-line tool built with Node.js to fetch data from Notion and Google Calendar and generate a daily briefing.

## Core Development Principles
* **Intentional Code:** Confirm the goal before generating or modifying code. Avoid adding code that wasn't explicitly requested.
* **High-Quality Code:** All generated code must be clean, follow modern best practices, and include clear, concise comments explaining the logic.
* **Test As We Build:** All new functionality must be verified with a test immediately after it is created.

## Key Files & Directories

* `index.js`: The main application entry point. Will be used to orchestrate calls to the services and the Gemini API.
* `package.json`: Manages project dependencies, including `express`, `@notionhq/client`, `googleapis`, and `dotenv`.
* `/services`: Contains modules for connecting to third-party APIs.
* `/tests`: Contains scripts for testing individual services (`test-notion.js`, `test-calendar.js`, etc.).

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

## Configuration

* `.env`: Stores all secret keys and IDs for Notion and Google Calendar. Loaded using `dotenv`.
* `credentials.json`: The OAuth 2.0 client configuration file downloaded from Google Cloud.