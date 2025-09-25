WORKING ON A CSV FEATURE
OPEN TO CONTRIBUTIONS AND SUGGESTIONS

# SQL Query Generator with Gemini API

A web application that generates SQL queries from natural language using the Google Gemini API. The app provides an interface to write natural language prompts, generate SQL, and execute queries against a SQLite database.

## Features

- Convert natural language to SQL using Google's Gemini API
- Execute SQL queries against a SQLite in-memory database
- View formatted results in a table
- Sample database with tables for a library management system


## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your GEMINI_API_KEY
4. Run the server: `npm run dev`
5. Open http://localhost:3000 in your browser

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Port to run the server on (defaults to 10000)

## API Endpoints

- `POST /api/execute-sql`: Execute SQL queries
- `POST /api/generate-sql`: Generate SQL from natural language
- `POST /api/delete-all-tables`: Delete all tables and reset the database
- `GET /health`: Health check and diagnostic information
- `GET /api/debug`: Debug information (non-production environments only)

## License

MIT
