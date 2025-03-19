const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Initialize Gemini API
// NOTE: Replace with your actual API key
const API_KEY = "AIzaSyAvoQJrPm1VA2l9cPiOZ8ualCb_yYsAz84";
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper function to generate SQL query from natural language
async function generateSQLQuery(prompt) {
  try {
    // Get the generative model (Gemini)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a prompt for SQL query generation
    const fullPrompt = `
      You are a SQL expert. Convert the following natural language request into a valid SQL query.
      Only return the SQL query without any additional explanation or markdown.
      
      Request: ${prompt}
    `;

    // Generate content
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating SQL query:", error);
    throw new Error("Failed to generate SQL query");
  }
}

// Route to handle SQL query generation
app.post('/api/generate-sql', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body" });
    }

    const sqlQuery = await generateSQLQuery(prompt);
    
    return res.status(200).json({
      success: true,
      query: sqlQuery
    });
  } catch (error) {
    console.error("Error in /api/generate-sql route:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});