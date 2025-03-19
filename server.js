const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

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

// Initialize SQLite database
let db;
(async () => {
  db = await open({
    filename: ":memory:", // In-memory database for demo purposes
    driver: sqlite3.Database,
  });

  // Create a sample database with test data
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
    
    INSERT OR IGNORE INTO customers (id, name, email, total_spent, join_date)
    VALUES 
      (1, 'John Doe', 'john@example.com', 1200.50, '2023-01-15'),
      (2, 'Jane Smith', 'jane@example.com', 850.75, '2023-02-20'),
      (3, 'Bob Johnson', 'bob@example.com', 2100.25, '2022-11-10'),
      (4, 'Alice Brown', 'alice@example.com', 450.30, '2023-03-05'),
      (5, 'Charlie Wilson', 'charlie@example.com', 1500.60, '2022-12-18');
      
    INSERT OR IGNORE INTO orders (customer_id, order_date, amount)
    VALUES
      (1, '2023-03-10', 250.50),
      (1, '2023-04-15', 350.75),
      (2, '2023-03-20', 150.25),
      (3, '2023-02-25', 800.30),
      (3, '2023-03-15', 650.45),
      (4, '2023-04-05', 200.10),
      (5, '2023-03-30', 450.60),
      (5, '2023-04-10', 350.25);
      
    -- Library database tables
    CREATE TABLE IF NOT EXISTS Authors (
      AuthorID INTEGER PRIMARY KEY AUTOINCREMENT,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Genres (
      GenreID INTEGER PRIMARY KEY AUTOINCREMENT,
      GenreName TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Publishers (
      PublisherID INTEGER PRIMARY KEY AUTOINCREMENT,
      PublisherName TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Books (
      BookID INTEGER PRIMARY KEY AUTOINCREMENT,
      Title TEXT NOT NULL,
      AuthorID INTEGER NOT NULL,
      GenreID INTEGER NOT NULL,
      PublisherID INTEGER NOT NULL,
      PublicationYear INTEGER,
      ISBN TEXT UNIQUE,
      FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID),
      FOREIGN KEY (GenreID) REFERENCES Genres(GenreID),
      FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID)
    );

    CREATE TABLE IF NOT EXISTS Patrons (
      PatronID INTEGER PRIMARY KEY AUTOINCREMENT,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      Address TEXT,
      PhoneNumber TEXT,
      Email TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Loans (
      LoanID INTEGER PRIMARY KEY AUTOINCREMENT,
      BookID INTEGER NOT NULL,
      PatronID INTEGER NOT NULL,
      LoanDate DATE NOT NULL,
      DueDate DATE NOT NULL,
      ReturnDate DATE,
      FOREIGN KEY (BookID) REFERENCES Books(BookID),
      FOREIGN KEY (PatronID) REFERENCES Patrons(PatronID)
    );

    INSERT OR IGNORE INTO Authors (FirstName, LastName) VALUES
      ('Jane', 'Austen'),
      ('George', 'Orwell'),
      ('J.R.R.', 'Tolkien');

    INSERT OR IGNORE INTO Genres (GenreName) VALUES
      ('Fiction'),
      ('Science Fiction'),
      ('Fantasy');

    INSERT OR IGNORE INTO Publishers (PublisherName) VALUES
      ('Penguin Classics'),
      ('Houghton Mifflin Harcourt');

    INSERT OR IGNORE INTO Books (Title, AuthorID, GenreID, PublisherID, PublicationYear, ISBN) VALUES
      ('Pride and Prejudice', 1, 1, 1, 1813, '978-0141439518'),
      ('Nineteen Eighty-Four', 2, 2, 1, 1949, '978-0451524935'),
      ('The Hobbit', 3, 3, 2, 1937, '978-0547928227');

    INSERT OR IGNORE INTO Patrons (FirstName, LastName, Address, PhoneNumber, Email) VALUES
      ('John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com'),
      ('Jane', 'Smith', '456 Oak Ave', '555-5678', 'jane.smith@example.com');

    INSERT OR IGNORE INTO Loans (BookID, PatronID, LoanDate, DueDate, ReturnDate) VALUES
      (1, 1, '2023-01-01', '2023-01-15', '2023-01-14'),
      (2, 2, '2023-02-01', '2023-02-15', NULL);
  `);

  console.log("SQLite database initialized with sample data");
})();

// Helper function to generate SQL query from natural language
async function generateSQLQuery(prompt) {
  try {
    // Get the generative model (Gemini)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a prompt for SQL query generation
    const fullPrompt = `
      You are a SQLITE expert. Convert the following natural language request into a valid SQLITE query.
      Only return the SQLITE query without any additional explanation or markdown.

      Do not include backticks, SQLITE comments, or markdown formatting.
      
      The database has the following schema:
      
      - Authors (AuthorID, FirstName, LastName)
      - Genres (GenreID, GenreName)
      - Publishers (PublisherID, PublisherName)
      - Books (BookID, Title, AuthorID, GenreID, PublisherID, PublicationYear, ISBN)
      - Patrons (PatronID, FirstName, LastName, Address, PhoneNumber, Email)
      - Loans (LoanID, BookID, PatronID, LoanDate, DueDate, ReturnDate)
      
      There's also a customers and orders table, but focus on the tables above for library-related queries.
      
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

// Helper function to clean SQL query from markdown or comments
function cleanSQLQuery(query) {
  // Remove markdown SQL backticks if present
  let cleaned = query.replace(/```sql\s*|```\s*$/g, "");

  // Remove SQL comments
  cleaned = cleaned.replace(/--.*$/gm, "");

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

// Helper function to format SQL results as a table
function formatResultsAsTable(results) {
  if (!results || results.length === 0) {
    return {
      raw: [],
      formatted: "No results returned.",
      columnInfo: {
        names: [],
        widths: {},
      },
    };
  }

  // Get column names from the first result
  const columns = Object.keys(results[0]);

  // Calculate column widths (accounting for headers and values)
  const columnWidths = {};
  columns.forEach((col) => {
    // Start with the header length
    columnWidths[col] = col.length;

    // Check each row's value length
    results.forEach((row) => {
      const valueStr = row[col] !== null ? String(row[col]) : "NULL";
      columnWidths[col] = Math.max(columnWidths[col], valueStr.length);
    });
  });

  // Create header row
  let tableOutput = "";
  let headerRow = "| ";
  let separator = "+-";

  columns.forEach((col) => {
    headerRow += col.padEnd(columnWidths[col]) + " | ";
    separator += "-".repeat(columnWidths[col]) + "-+-";
  });

  // Remove the trailing '+-' and add a '+' at the end
  separator = separator.slice(0, -2) + "+";

  // Build the table
  tableOutput += separator + "\n";
  tableOutput += headerRow + "\n";
  tableOutput += separator + "\n";

  // Add data rows
  results.forEach((row) => {
    let dataRow = "| ";
    columns.forEach((col) => {
      const value = row[col] !== null ? String(row[col]) : "NULL";
      dataRow += value.padEnd(columnWidths[col]) + " | ";
    });
    tableOutput += dataRow + "\n";
  });

  tableOutput += separator;

  return {
    raw: results,
    formatted: tableOutput,
    columnInfo: {
      names: columns,
      widths: columnWidths,
    },
  };
}

// Route to handle SQL query generation
app.post("/api/generate-sql", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body" });
    }

    let sqlQuery = await generateSQLQuery(prompt);
    sqlQuery = cleanSQLQuery(sqlQuery);

    return res.status(200).json({
      success: true,
      query: sqlQuery,
    });
  } catch (error) {
    console.error("Error in /api/generate-sql route:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Route to execute SQL queries
app.post("/api/execute-sql", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query in request body" });
    }

    // Clean the SQL query
    const cleanedQuery = cleanSQLQuery(query);

    // Prevent destructive SQL operations in this demo
    const lowerQuery = cleanedQuery.toLowerCase();
    if (
      lowerQuery.includes("drop table") ||
      lowerQuery.includes("delete from") ||
      lowerQuery.includes("truncate") ||
      lowerQuery.includes("alter table")
    ) {
      return res.status(403).json({
        error: "Destructive operations not allowed in this demo",
      });
    }

    // Check if multiple statements are present (separated by semicolons)
    const statements = cleanedQuery
      .split(";")
      .filter((stmt) => stmt.trim() !== "");

    if (statements.length > 1) {
      // Handle multiple statements
      let allResults = [];
      let combinedMessage = "";

      for (const statement of statements) {
        if (!statement.trim()) continue;

        // Execute each statement
        const firstWord = statement.trim().toLowerCase().split(/\s+/)[0];
        let result;

        if (firstWord === "select") {
          result = await db.all(statement);
          combinedMessage += `SELECT query executed successfully. ${result.length} row(s) returned. `;

          if (result.length > 0) {
            allResults.push({
              query: statement.trim(),
              results: result,
              formattedTable: formatResultsAsTable(result).formatted,
            });
          }
        } else if (["insert", "update", "delete"].includes(firstWord)) {
          const execResult = await db.run(statement);
          combinedMessage += `${firstWord.toUpperCase()} statement executed successfully. ${
            execResult.changes
          } row(s) affected. `;
        } else if (["create", "drop", "alter", "pragma"].includes(firstWord)) {
          await db.exec(statement);
          combinedMessage += `${firstWord.toUpperCase()} statement executed successfully. `;
        } else {
          await db.exec(statement);
          combinedMessage += `Statement executed successfully. `;
        }
      }

      return res.status(200).json({
        success: true,
        query: cleanedQuery,
        isMultiStatement: true,
        results: allResults,
        message: combinedMessage.trim(),
      });
    } else {
      // Execute a single statement (existing logic)
      let results;
      let message = "";

      // Determine the type of SQL statement
      const firstWord = lowerQuery.trim().split(/\s+/)[0];

      if (firstWord === "select") {
        // For SELECT queries
        results = await db.all(cleanedQuery);
        message =
          results.length === 0
            ? "Query executed successfully. No rows returned."
            : `Query executed successfully. ${results.length} row(s) returned.`;
      } else if (["insert", "update", "delete"].includes(firstWord)) {
        // For DML statements
        const result = await db.run(cleanedQuery);
        message = `Query executed successfully. ${result.changes} row(s) affected.`;
        results = [
          { operation: firstWord.toUpperCase(), rowsAffected: result.changes },
        ];
      } else if (["create", "drop", "alter", "pragma"].includes(firstWord)) {
        // For DDL statements
        await db.exec(cleanedQuery);
        message = `${firstWord.toUpperCase()} statement executed successfully.`;
        results = [{ operation: firstWord.toUpperCase(), result: "Success" }];
      } else {
        // For other statements
        await db.exec(cleanedQuery);
        message = "Query executed successfully.";
        results = [{ result: "Success" }];
      }

      // Format the results as a table
      const formattedResults = formatResultsAsTable(results);

      return res.status(200).json({
        success: true,
        query: cleanedQuery,
        results: formattedResults.raw,
        formattedTable: formattedResults.formatted,
        message: message,
        columns: formattedResults.columnInfo,
      });
    }
  } catch (error) {
    console.error("Error executing SQL query:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error executing SQL query",
    });
  }
});

// Simple route to delete all tables without re-creating them
app.post("/api/delete-all-tables", async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== "CONFIRM_DELETE") {
      return res.status(400).json({
        success: false,
        error:
          "Confirmation required. Please provide 'CONFIRM_DELETE' in the confirmation field.",
      });
    }

    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );

    // Begin a transaction
    await db.exec("BEGIN TRANSACTION;");

    try {
      // Drop each table
      for (const table of tables) {
        await db.exec(`DROP TABLE IF EXISTS ${table.name};`);
      }

      // Commit changes
      await db.exec("COMMIT;");

      return res.status(200).json({
        success: true,
        message: `All tables deleted successfully. ${tables.length} tables dropped.`,
        tablesDropped: tables.map((t) => t.name),
      });
    } catch (error) {
      // Rollback if anything goes wrong
      await db.exec("ROLLBACK;");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting tables:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error deleting tables",
    });
  }
});
// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
