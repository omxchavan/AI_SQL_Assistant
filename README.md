# SQL Query Generator with Gemini API

A web application that generates SQL queries from natural language using the Google Gemini API. The app provides an interface to write natural language prompts, generate SQL, and execute queries against a SQLite database.

## Features

- Convert natural language to SQL using Google's Gemini API
- Execute SQL queries against a SQLite in-memory database
- View formatted results in a table
- Sample database with tables for a library management system

## Deployment on Render

### Option 1: Deploy with Render Dashboard

1. Fork or clone this repository to your GitHub account
2. Go to [Render](https://render.com/) and sign up or log in
3. Click on "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: `sql-gemini-app` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add the environment variable:
   - GEMINI_API_KEY: Your Google Gemini API key
7. Click "Create Web Service"

### Option 2: Deploy with Render Blueprint

This repository includes a `render.yaml` file that can be used with Render Blueprints:

1. Fork or clone this repository to your GitHub account
2. Go to [Render](https://render.com/) and sign up or log in
3. Create a new Blueprint
4. Connect your GitHub repository
5. Configure the environment variables:
   - GEMINI_API_KEY: Your Google Gemini API key
6. Deploy the Blueprint

### Troubleshooting Render Deployment

If you encounter issues with your deployment:

1. **Check Gemini API Key**: Ensure your `GEMINI_API_KEY` is correctly set in Render's environment variables
2. **Check Application Logs**: In the Render dashboard, navigate to your service's logs to see any error messages
3. **Health Endpoint**: Visit the `/health` endpoint of your deployed app to check system status
4. **See Detailed Guide**: For more detailed troubleshooting steps, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your GEMINI_API_KEY
4. Run the server: `npm run dev`
5. Open http://localhost:3000 in your browser

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Port to run the server on (defaults to 3000)

## API Endpoints

- `POST /api/execute-sql`: Execute SQL queries
- `POST /api/generate-sql`: Generate SQL from natural language
- `POST /api/delete-all-tables`: Delete all tables and reset the database
- `GET /health`: Health check and diagnostic information


## License

MIT
