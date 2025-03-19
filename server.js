const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
require("dotenv").config();

// Initialize the Express application
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize SQLite database - function to be called in each route handler
async function initializeDatabase() {
  const database = await open({
    filename: ":memory:", // In-memory database for serverless environment
    driver: sqlite3.Database,
  });

  // Create a sample database with test data
  await database.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      total_spent REAL DEFAULT 0,
      join_date TEXT
    );
    
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      order_date TEXT,
      amount REAL,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );
    
    INSERT OR IGNORE INTO customers (id, name, email, total_spent, join_date)
    VALUES 
      (1, 'John Doe', 'john@example.com', 1200.50, '2023-01-15'),
      (2, 'Jane Smith', 'jane@example.com', 850.75, '2023-02-20'),
      (3, 'Bob Johnson', 'bob@example.com', 2100.25, '2022-11-10'),
      (4, 'Alice Brown', 'alice@example.com', 1500.00, '2023-03-05'),
      (5, 'Charlie Davis', 'charlie@example.com', 3200.75, '2022-09-22');

    INSERT OR IGNORE INTO orders (id, customer_id, order_date, amount)
    VALUES
      (1, 1, '2023-03-10', 250.50),
      (2, 1, '2023-04-15', 125.25),
      (3, 2, '2023-03-20', 450.00),
      (4, 3, '2023-02-05', 780.50),
      (5, 3, '2023-04-10', 320.75),
      (6, 4, '2023-04-05', 600.25),
      (7, 5, '2023-03-15', 1200.50),
      (8, 5, '2023-04-20', 950.25);

    -- Create Books table
    CREATE TABLE IF NOT EXISTS Books (
      BookID INTEGER PRIMARY KEY,
      Title TEXT NOT NULL,
      AuthorID INTEGER,
      ISBN TEXT UNIQUE,
      PublishedYear INTEGER,
      GenreID INTEGER,
      Price REAL,
      Description TEXT,
      FOREIGN KEY(AuthorID) REFERENCES Authors(AuthorID),
      FOREIGN KEY(GenreID) REFERENCES Genres(GenreID)
    );

    -- Create Authors table
    CREATE TABLE IF NOT EXISTS Authors (
      AuthorID INTEGER PRIMARY KEY,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      BirthYear INTEGER,
      CountryOfOrigin TEXT
    );

    -- Create Genres table
    CREATE TABLE IF NOT EXISTS Genres (
      GenreID INTEGER PRIMARY KEY,
      GenreName TEXT NOT NULL,
      Description TEXT
    );

    -- Create Patrons table
    CREATE TABLE IF NOT EXISTS Patrons (
      PatronID INTEGER PRIMARY KEY,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Email TEXT UNIQUE,
      PhoneNumber TEXT,
      Address TEXT,
      MembershipDate TEXT
    );

    -- Create Loans table
    CREATE TABLE IF NOT EXISTS Loans (
      LoanID INTEGER PRIMARY KEY,
      PatronID INTEGER,
      BookID INTEGER,
      LoanDate TEXT NOT NULL,
      DueDate TEXT NOT NULL,
      ReturnDate TEXT,
      FOREIGN KEY(PatronID) REFERENCES Patrons(PatronID),
      FOREIGN KEY(BookID) REFERENCES Books(BookID)
    );

    -- Insert sample data for Authors
    INSERT OR IGNORE INTO Authors (AuthorID, FirstName, LastName, BirthYear, CountryOfOrigin)
    VALUES
      (1, 'J.K.', 'Rowling', 1965, 'United Kingdom'),
      (2, 'George', 'Orwell', 1903, 'United Kingdom'),
      (3, 'Jane', 'Austen', 1775, 'United Kingdom'),
      (4, 'F. Scott', 'Fitzgerald', 1896, 'United States'),
      (5, 'Harper', 'Lee', 1926, 'United States');

    -- Insert sample data for Genres
    INSERT OR IGNORE INTO Genres (GenreID, GenreName, Description)
    VALUES
      (1, 'Fantasy', 'Fiction with supernatural elements'),
      (2, 'Dystopian', 'Fiction set in a repressive society'),
      (3, 'Classic', 'Works of enduring excellence'),
      (4, 'Romance', 'Stories about love relationships'),
      (5, 'Historical Fiction', 'Fiction set in the past');

    -- Insert sample data for Books
    INSERT OR IGNORE INTO Books (BookID, Title, AuthorID, ISBN, PublishedYear, GenreID, Price, Description)
    VALUES
      (1, 'Harry Potter and the Philosopher''s Stone', 1, '9780747532743', 1997, 1, 15.99, 'The first book in the Harry Potter series'),
      (2, '1984', 2, '9780451524935', 1949, 2, 12.50, 'A dystopian novel about totalitarianism'),
      (3, 'Pride and Prejudice', 3, '9780141439518', 1813, 4, 9.99, 'A romantic novel of manners'),
      (4, 'The Great Gatsby', 4, '9780743273565', 1925, 3, 14.25, 'A novel about the American Dream'),
      (5, 'To Kill a Mockingbird', 5, '9780061120084', 1960, 3, 11.99, 'A novel about racial injustice');

    -- Insert sample data for Patrons
    INSERT OR IGNORE INTO Patrons (PatronID, FirstName, LastName, Email, PhoneNumber, Address, MembershipDate)
    VALUES
      (1, 'Emma', 'Johnson', 'emma@example.com', '555-1234', '123 Main St', '2022-01-15'),
      (2, 'Michael', 'Smith', 'michael@example.com', '555-5678', '456 Elm St', '2022-02-20'),
      (3, 'Sophia', 'Williams', 'sophia@example.com', '555-9012', '789 Oak St', '2022-03-25'),
      (4, 'William', 'Brown', 'william@example.com', '555-3456', '101 Pine St', '2022-04-10'),
      (5, 'Olivia', 'Jones', 'olivia@example.com', '555-7890', '202 Maple St', '2022-05-05');

    -- Insert sample data for Loans
    INSERT OR IGNORE INTO Loans (LoanID, PatronID, BookID, LoanDate, DueDate, ReturnDate)
    VALUES
      (1, 1, 1, '2023-01-10', '2023-01-24', '2023-01-22'),
      (2, 2, 3, '2023-01-15', '2023-01-29', '2023-01-28'),
      (3, 3, 5, '2023-02-05', '2023-02-19', NULL),
      (4, 4, 2, '2023-02-10', '2023-02-24', '2023-02-20'),
      (5, 5, 4, '2023-02-15', '2023-03-01', NULL),
      (6, 1, 3, '2023-03-01', '2023-03-15', '2023-03-10'),
      (7, 2, 5, '2023-03-05', '2023-03-19', NULL),
      (8, 3, 1, '2023-03-10', '2023-03-24', NULL);
  `);

  return database;
}

// Route to serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API route to execute SQL queries
app.post("/api/execute-sql", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: "No query provided" });
  }

  try {
    // Initialize database for this request
    const db = await initializeDatabase();
    
    // Check if this is a multi-statement query
    const statements = query
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    if (statements.length > 1) {
      // Handle multiple statements
      const results = [];
      for (const statement of statements) {
        try {
          // Skip DROP TABLE statements for security
          if (statement.toLowerCase().includes("drop table")) {
            results.push({
              query: statement,
              error: "DROP TABLE statements are not allowed",
            });
            continue;
          }

          const stmtResult = await db.all(`${statement};`);
          results.push({
            query: statement,
            results: stmtResult,
          });
        } catch (err) {
          results.push({
            query: statement,
            error: err.message,
          });
        }
      }

      return res.json({
        success: true,
        message: "Multiple statements executed",
        isMultiStatement: true,
        results,
      });
    } else {
      // Handle single statement
      const singleQuery = statements[0];

      // Skip DROP TABLE statements for security
      if (singleQuery.toLowerCase().includes("drop table")) {
        return res.status(400).json({
          success: false,
          error: "DROP TABLE statements are not allowed",
        });
      }

      const results = await db.all(singleQuery);
      return res.json({
        success: true,
        message: "Query executed successfully",
        results,
      });
    }
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// API route to generate SQL from natural language
app.post("/api/generate-sql", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res
      .status(400)
      .json({ success: false, error: "No prompt provided" });
  }

  try {
    const sqlQuery = await generateSQLQuery(prompt);
    return res.json({ success: true, query: cleanSQLQuery(sqlQuery) });
  } catch (error) {
    console.error("Error generating SQL:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate SQL. Please try again.",
    });
  }
});

// API route to delete all tables
app.post("/api/delete-all-tables", async (req, res) => {
  const { confirmation } = req.body;

  if (confirmation !== "CONFIRM_DELETE") {
    return res.status(400).json({
      success: false,
      error: "Invalid confirmation. Tables not deleted.",
    });
  }

  try {
    // Initialize database for this request
    const db = await initializeDatabase();
    
    // Get all table names
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );

    if (tables.length === 0) {
      return res.json({
        success: true,
        message: "No tables to delete.",
      });
    }

    // Drop each table
    for (const { name } of tables) {
      await db.exec(`DROP TABLE IF EXISTS ${name};`);
    }

    // Recreate the database schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        total_spent REAL DEFAULT 0,
        join_date TEXT
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        order_date TEXT,
        amount REAL,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );
    `);

    return res.json({
      success: true,
      message: `All tables deleted successfully. Database reset to initial state.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Error deleting tables: ${error.message}`,
    });
  }
});

// Helper function to generate SQL queries using Gemini
async function generateSQLQuery(prompt) {
  try {
    // Create context with database schema
    const schema = `
    Tables:
    - Customers: id (PK), name, email, total_spent, join_date
    - Orders: id (PK), customer_id (FK), order_date, amount
    - Books: BookID (PK), Title, AuthorID (FK), ISBN, PublishedYear, GenreID (FK), Price, Description
    - Authors: AuthorID (PK), FirstName, LastName, BirthYear, CountryOfOrigin
    - Genres: GenreID (PK), GenreName, Description
    - Patrons: PatronID (PK), FirstName, LastName, Email, PhoneNumber, Address, MembershipDate
    - Loans: LoanID (PK), PatronID (FK), BookID (FK), LoanDate, DueDate, ReturnDate
    `;

    const fullPrompt = `Given this database schema:
    ${schema}
    
    Generate a valid SQL query for this request: "${prompt}"
    
    Return only the SQL query with no explanations or additional text.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    return text;
  } catch (error) {
    console.error("Error generating SQL with Gemini:", error);
    throw new Error("Failed to generate SQL query");
  }
}

// Helper to clean the SQL query from Gemini's response
function cleanSQLQuery(query) {
  // Remove markdown code blocks if present
  let cleanedQuery = query
    .replace(/```sql/gi, "")
    .replace(/```/g, "")
    .trim();

  // Remove any potential "SQL Query:" or similar prefixes
  cleanedQuery = cleanedQuery.replace(/^(SQL query:|Query:|SQL:)\s*/i, "");

  return cleanedQuery;
}

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless functions
module.exports = app;