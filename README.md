# SQL Generator App

A web application that allows users to generate SQL queries from natural language using the Gemini API.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser to `http://localhost:3000`

## Features

- Natural language to SQL conversion
- SQL query execution
- Sample database with multiple tables
- Database management

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite (in-memory)
- **AI Integration**: Google Gemini AI
- **Syntax Highlighting**: highlight.js

## Deployment on Vercel

### Prerequisites

- A Vercel account
- Node.js installed locally
- Git installed on your machine

### Steps to Deploy

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd sql-query-tester
   ```

2. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

3. **Log in to Vercel**

   ```bash
   vercel login
   ```

4. **Deploy to Vercel**

   ```bash
   vercel
   ```

5. **Set up environment variables**

   Create a `.env` file locally for development:

   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

   Add the same environment variables in the Vercel dashboard under your project settings.

6. **Configure project settings**

   - In the Vercel dashboard, go to your project
   - Navigate to "Settings" → "Environment Variables"
   - Add the `GEMINI_API_KEY` variable

## Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. **Access the application**

   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- `POST /api/execute-sql`: Execute SQL queries
- `POST /api/generate-sql`: Generate SQL from natural language
- `POST /api/delete-all-tables`: Delete all tables and reset the database

## License

MIT
