// Combined SQL Interface Script - Database and CSV functionality
// Author: Assistant
// Description: Handles both database operations and CSV file processing

(function() {
  'use strict';

  // ========================
  // DOM Element References
  // ========================
  
  // Common elements
  const directTab = document.getElementById("direct-tab");
  const nlTab = document.getElementById("nl-tab");
  const directContainer = document.getElementById("direct-container");
  const nlContainer = document.getElementById("nl-container");
  const sqlQuery = document.getElementById("sql-query");
  const executeBtn = document.getElementById("execute-btn");
  const sqlStatus = document.getElementById("sql-status");
  const sqlResponseTable = document.getElementById("sql-response-table");
  const sqlResponseEditor = document.getElementById("sql-response-editor");
  const executeEditedSql = document.getElementById("execute-edited-sql");
  const nlQuery = document.getElementById("nl-query");
  const generateBtn = document.getElementById("generate-btn");
  const generatedSql = document.getElementById("generated-sql");
  const executeGeneratedBtn = document.getElementById("execute-generated-btn");
  const copyGeneratedSql = document.getElementById("copy-generated-sql");
  const nlStatus = document.getElementById("nl-status");
  const nlResponseTable = document.getElementById("nl-response-table");
  const examples = document.querySelectorAll(".example");
  const clearSqlBtn = document.getElementById("clear-sql-btn");
  const clearNlBtn = document.getElementById("clear-nl-btn");

  // CSV file upload elements
  const fileUploadArea = document.getElementById("file-upload-area");
  const csvFileInput = document.getElementById("csv-file");
  const fileInfo = document.getElementById("file-info");
  const filenameSpan = document.getElementById("filename");
  const filesizeSpan = document.getElementById("filesize");
  const columnCountSpan = document.getElementById("column-count");
  const rowCountSpan = document.getElementById("row-count");
  const columnPreviewBody = document.getElementById("column-preview-body");
  const fileError = document.getElementById("file-error");

  const nlFileUploadArea = document.getElementById("nl-file-upload-area");
  const nlCsvFileInput = document.getElementById("nl-csv-file");
  const nlFileInfo = document.getElementById("nl-file-info");
  const nlFilenameSpan = document.getElementById("nl-filename");
  const nlFilesizeSpan = document.getElementById("nl-filesize");
  const nlColumnCountSpan = document.getElementById("nl-column-count");
  const nlRowCountSpan = document.getElementById("nl-row-count");
  const nlColumnPreviewBody = document.getElementById("nl-column-preview-body");
  const nlFileError = document.getElementById("nl-file-error");

  // Database management elements
  const deleteTablesBtn = document.getElementById("delete-tables-btn");
  const confirmDeleteDiv = document.getElementById("confirm-delete");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const deleteStatus = document.getElementById("delete-status");

  // ========================
  // Application State
  // ========================
  
  let uploadedCsvData = null;
  let uploadedCsvFilename = null;
  let isCSVMode = false; // Flag to determine if we're in CSV mode

  // ========================
  // Utility Functions
  // ========================
  
  /**
   * Apply SQL syntax highlighting to an element
   * @param {HTMLElement} element - Element to highlight
   */
  function applySqlHighlighting(element) {
    if (typeof hljs !== 'undefined') {
      element.classList.add("hljs", "language-sql");
      hljs.highlightElement(element);
    }
  }

  /**
   * Setup syntax highlighting for editors
   */
  function setupSyntaxHighlighting() {
    if (sqlResponseEditor) {
      sqlResponseEditor.addEventListener("input", function() {
        applySqlHighlighting(this);
      });
    }

    if (generatedSql) {
      generatedSql.addEventListener("input", function() {
        applySqlHighlighting(this);
      });
    }
  }

  /**
   * Detect if we're in CSV mode based on page elements
   */
  function detectCSVMode() {
    isCSVMode = !!(fileUploadArea || nlFileUploadArea);
  }

  /**
   * Create an HTML table from JSON data
   * @param {Object} data - Data object with results array
   * @returns {HTMLElement|string} Table element or message
   */
  function createTable(data) {
    if (!data || !data.results || data.results.length === 0) {
      return "<p>No results returned.</p>";
    }

    const tableElement = document.createElement("table");
    tableElement.className = "result-table";

    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const columnNames = Object.keys(data.results[0]);
    columnNames.forEach((colName) => {
      const th = document.createElement("th");
      th.textContent = colName;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    tableElement.appendChild(thead);

    // Create data rows
    const tbody = document.createElement("tbody");
    data.results.forEach((row) => {
      const tr = document.createElement("tr");

      columnNames.forEach((colName) => {
        const td = document.createElement("td");
        td.textContent = row[colName] !== null ? row[colName] : "NULL";
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    tableElement.appendChild(tbody);
    return tableElement;
  }

  // ========================
  // Tab Management
  // ========================
  
  function setupTabSwitching() {
    if (directTab && nlTab && directContainer && nlContainer) {
      directTab.addEventListener("click", () => {
        directTab.classList.add("active");
        nlTab.classList.remove("active");
        directContainer.style.display = "flex";
        nlContainer.style.display = "none";
      });

      nlTab.addEventListener("click", () => {
        nlTab.classList.add("active");
        directTab.classList.remove("active");
        nlContainer.style.display = "flex";
        directContainer.style.display = "none";
      });
    }
  }

  // ========================
  // SQL Query Execution
  // ========================
  
  /**
   * Execute SQL query (database or CSV based on mode)
   * @param {string} query - SQL query to execute
   * @param {HTMLElement} statusElement - Status display element
   * @param {HTMLElement} resultTableElement - Result table container
   * @param {HTMLElement} responseEditorElement - Optional editor element
   */
  async function executeQuery(query, statusElement, resultTableElement, responseEditorElement) {
    if (!query) {
      statusElement.textContent = "Please enter a SQL query";
      return;
    }

    // Check CSV mode requirements
    if (isCSVMode && !uploadedCsvData) {
      statusElement.textContent = "Please upload a CSV file first";
      return;
    }

    statusElement.textContent = "Executing query...";
    resultTableElement.innerHTML = "";

    if (responseEditorElement) {
      responseEditorElement.textContent = "";
    }

    try {
      // Determine endpoint and payload based on mode
      const endpoint = isCSVMode ? "/api/execute-csv-sql" : "/api/execute-sql";
      const payload = isCSVMode ? {
        query,
        csvData: uploadedCsvData,
        filename: uploadedCsvFilename
      } : { query };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        statusElement.textContent = `Error: ${data.error}`;
        return;
      }

      statusElement.textContent = data.message;

      if (data.isMultiStatement) {
        // Handle multiple statements
        data.results.forEach((result, index) => {
          const queryHeader = document.createElement("h3");
          queryHeader.textContent = `Query ${index + 1}: ${result.query}`;
          resultTableElement.appendChild(queryHeader);

          if (result.results && result.results.length > 0) {
            const tableWrapper = document.createElement("div");
            tableWrapper.style.marginBottom = "20px";

            const tableData = { results: result.results };
            tableWrapper.appendChild(createTable(tableData));
            resultTableElement.appendChild(tableWrapper);
          } else {
            const noResults = document.createElement("p");
            noResults.textContent = "No results returned for this query.";
            resultTableElement.appendChild(noResults);
          }
        });
      } else {
        // Handle single statement
        if (data.results && data.results.length > 0) {
          resultTableElement.appendChild(createTable(data));

          if (responseEditorElement) {
            responseEditorElement.textContent = isCSVMode ? query : (data.query || query);
            applySqlHighlighting(responseEditorElement);
          }
        } else {
          const noResults = document.createElement("p");
          noResults.textContent = "Query executed successfully, but no results were returned.";
          resultTableElement.appendChild(noResults);
        }
      }
    } catch (error) {
      statusElement.textContent = `Error: ${error.message}`;
    }
  }

  // ========================
  // SQL Generation from Natural Language
  // ========================
  
  /**
   * Generate SQL from natural language prompt
   */
  async function generateSQLFromPrompt() {
    const prompt = nlQuery.value.trim();
    if (!prompt) {
      generatedSql.textContent = "Please enter a natural language query";
      return;
    }

    // Check CSV mode requirements
    if (isCSVMode && !uploadedCsvData) {
      generatedSql.textContent = "Please upload a CSV file first";
      return;
    }

    generatedSql.textContent = "Generating SQL...";
    executeGeneratedBtn.style.display = "none";
    copyGeneratedSql.style.display = "none";
    nlStatus.textContent = "";
    nlResponseTable.innerHTML = "";

    try {
      // Determine endpoint and payload based on mode
      const endpoint = isCSVMode ? "/api/generate-csv-sql" : "/api/generate-sql";
      const payload = isCSVMode ? {
        prompt,
        csvData: uploadedCsvData,
        filename: uploadedCsvFilename
      } : { prompt };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        generatedSql.textContent = `Error: ${data.error}`;
        return;
      }

      generatedSql.textContent = data.query;
      applySqlHighlighting(generatedSql);
      executeGeneratedBtn.style.display = "block";
      copyGeneratedSql.style.display = "block";
    } catch (error) {
      generatedSql.textContent = `Error: ${error.message}`;
    }
  }

  // ========================
  // CSV File Processing
  // ========================
  
  /**
   * Parse CSV text into structured data
   * @param {string} csvText - Raw CSV text
   * @returns {Object} Parsed data with headers and rows
   */
  function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row");
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue;

      const values = parseCSVLine(lines[i]);
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      rows.push(row);
    }

    return { headers, rows };
  }

  /**
   * Parse a single CSV line handling quotes and commas
   * @param {string} line - CSV line to parse
   * @returns {Array} Array of values
   */
  function parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Handle file upload for CSV processing
   * @param {File} file - File object to process
   * @param {boolean} isNlTab - Whether this is for the NL tab
   */
  function handleFileUpload(file, isNlTab = false) {
    const errorElement = isNlTab ? nlFileError : fileError;

    // Reset error message
    if (errorElement) {
      errorElement.style.display = "none";
      errorElement.textContent = "";
    }

    if (!file) {
      showError(errorElement, "Please select a file");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showError(errorElement, "Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const csvData = e.target.result;
        const parsedData = parseCSV(csvData);

        // Store the parsed data
        uploadedCsvData = parsedData;
        uploadedCsvFilename = file.name;

        // Update UI
        updateFileInfo(file, parsedData.rows.length, parsedData.headers, parsedData.rows, isNlTab);
      } catch (error) {
        showError(errorElement, `Error parsing CSV: ${error.message}`);
      }
    };

    reader.onerror = function() {
      showError(errorElement, "Error reading file");
    };

    reader.readAsText(file);
  }

  /**
   * Show error message
   * @param {HTMLElement} element - Error display element
   * @param {string} message - Error message
   */
  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  /**
   * Update file information display
   * @param {File} file - Uploaded file
   * @param {number} rowCount - Number of data rows
   * @param {Array} headers - Column headers
   * @param {Array} rows - Data rows
   * @param {boolean} isNlTab - Whether this is for the NL tab
   */
  function updateFileInfo(file, rowCount, headers, rows, isNlTab = false) {
    const fileSize = Math.round(file.size / 1024);

    if (isNlTab && nlFilenameSpan) {
      nlFilenameSpan.textContent = file.name;
      nlFilesizeSpan.textContent = `${fileSize} KB`;
      nlColumnCountSpan.textContent = headers.length;
      nlRowCountSpan.textContent = rowCount;

      // Update column preview
      if (nlColumnPreviewBody) {
        nlColumnPreviewBody.innerHTML = "";
        headers.forEach((header) => {
          const tr = document.createElement("tr");
          const tdName = document.createElement("td");
          const tdSample = document.createElement("td");

          tdName.textContent = header;
          const sampleValue = rows[0] && rows[0][header] ? rows[0][header] : "N/A";
          tdSample.textContent = sampleValue.length > 50 ? 
            sampleValue.substring(0, 50) + "..." : sampleValue;

          tr.appendChild(tdName);
          tr.appendChild(tdSample);
          nlColumnPreviewBody.appendChild(tr);
        });
      }

      if (nlFileInfo) nlFileInfo.classList.add("visible");
      if (nlFileUploadArea) nlFileUploadArea.classList.add("active");
    } else if (!isNlTab && filenameSpan) {
      filenameSpan.textContent = file.name;
      filesizeSpan.textContent = `${fileSize} KB`;
      columnCountSpan.textContent = headers.length;
      rowCountSpan.textContent = rowCount;

      // Update column preview
      if (columnPreviewBody) {
        columnPreviewBody.innerHTML = "";
        headers.forEach((header) => {
          const tr = document.createElement("tr");
          const tdName = document.createElement("td");
          const tdSample = document.createElement("td");

          tdName.textContent = header;
          const sampleValue = rows[0] && rows[0][header] ? rows[0][header] : "N/A";
          tdSample.textContent = sampleValue.length > 50 ? 
            sampleValue.substring(0, 50) + "..." : sampleValue;

          tr.appendChild(tdName);
          tr.appendChild(tdSample);
          columnPreviewBody.appendChild(tr);
        });
      }

      if (fileInfo) fileInfo.classList.add("visible");
      if (fileUploadArea) fileUploadArea.classList.add("active");
    }
  }

  // ========================
  // Database Management
  // ========================
  
  /**
   * Setup database management functionality
   */
  function setupDatabaseManagement() {
    if (!deleteTablesBtn || !confirmDeleteDiv || !confirmDeleteBtn || !cancelDeleteBtn) {
      return; // Skip if elements don't exist
    }

    // Show confirmation when delete button is clicked
    deleteTablesBtn.addEventListener("click", () => {
      confirmDeleteDiv.style.display = "block";
      if (deleteStatus) deleteStatus.textContent = "";
    });

    // Cancel delete operation
    cancelDeleteBtn.addEventListener("click", () => {
      confirmDeleteDiv.style.display = "none";
    });

    // Confirm delete operation
    confirmDeleteBtn.addEventListener("click", async () => {
      try {
        if (deleteStatus) deleteStatus.textContent = "Deleting tables...";

        const response = await fetch("/api/delete-all-tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ confirmation: "CONFIRM_DELETE" }),
        });

        const data = await response.json();

        if (data.success) {
          if (deleteStatus) deleteStatus.textContent = data.message;
          // Clear any query results
          if (sqlResponseTable) sqlResponseTable.innerHTML = "";
          if (nlResponseTable) nlResponseTable.innerHTML = "";
          if (sqlStatus) sqlStatus.textContent = "";
          if (nlStatus) nlStatus.textContent = "";
        } else {
          if (deleteStatus) deleteStatus.textContent = `Error: ${data.error}`;
        }
      } catch (error) {
        if (deleteStatus) deleteStatus.textContent = `Error: ${error.message}`;
      } finally {
        confirmDeleteDiv.style.display = "none";
      }
    });
  }

  // ========================
  // Event Listeners Setup
  // ========================
  
  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Execute direct SQL query
    if (executeBtn) {
      executeBtn.addEventListener("click", () => {
        const query = sqlQuery ? sqlQuery.value.trim() : "";
        executeQuery(query, sqlStatus, sqlResponseTable, sqlResponseEditor);
      });
    }

    // Generate SQL from natural language
    if (generateBtn) {
      generateBtn.addEventListener("click", generateSQLFromPrompt);
    }

    // Copy generated SQL
    if (copyGeneratedSql) {
      copyGeneratedSql.addEventListener("click", () => {
        const text = generatedSql.textContent;
        navigator.clipboard.writeText(text).then(
          () => {
            const originalText = copyGeneratedSql.textContent;
            copyGeneratedSql.textContent = "Copied!";
            setTimeout(() => {
              copyGeneratedSql.textContent = originalText;
            }, 2000);
          },
          (err) => {
            console.error("Could not copy text: ", err);
          }
        );
      });
    }

    // Execute generated SQL
    if (executeGeneratedBtn) {
      executeGeneratedBtn.addEventListener("click", () => {
        const query = generatedSql ? generatedSql.textContent.trim() : "";
        executeQuery(query, nlStatus, nlResponseTable);
      });
    }

    // Example queries
    examples.forEach((example) => {
      example.addEventListener("click", () => {
        if (sqlQuery) {
          sqlQuery.value = example.getAttribute("data-query");
          // Auto-switch to direct SQL tab
          if (directTab) directTab.click();
        }
      });
    });

    // Clear buttons
    if (clearSqlBtn) {
      clearSqlBtn.addEventListener("click", () => {
        if (sqlQuery) sqlQuery.value = "";
        if (sqlStatus) sqlStatus.textContent = "";
        if (sqlResponseTable) sqlResponseTable.innerHTML = "";
        if (sqlResponseEditor) sqlResponseEditor.textContent = "";
      });
    }

    if (clearNlBtn) {
      clearNlBtn.addEventListener("click", () => {
        if (nlQuery) nlQuery.value = "";
        if (generatedSql) generatedSql.textContent = "";
        if (nlStatus) nlStatus.textContent = "";
        if (nlResponseTable) nlResponseTable.innerHTML = "";
        if (executeGeneratedBtn) executeGeneratedBtn.style.display = "none";
        if (copyGeneratedSql) copyGeneratedSql.style.display = "none";
      });
    }

    // Setup CSV file upload events
    setupFileUploadEvents();
  }

  /**
   * Setup file upload event listeners for CSV mode
   */
  function setupFileUploadEvents() {
    if (!isCSVMode) return;

    // Main file upload area
    if (fileUploadArea && csvFileInput) {
      fileUploadArea.addEventListener("click", () => csvFileInput.click());

      fileUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--primary-color") || "#007bff";
      });

      fileUploadArea.addEventListener("dragleave", () => {
        fileUploadArea.style.borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--border-color") || "#ddd";
      });

      fileUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileUpload(file, false);
        fileUploadArea.style.borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--border-color") || "#ddd";
      });

      csvFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleFileUpload(file, false);
      });
    }

    // NL file upload area
    if (nlFileUploadArea && nlCsvFileInput) {
      nlFileUploadArea.addEventListener("click", () => nlCsvFileInput.click());

      nlFileUploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        nlFileUploadArea.style.borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--primary-color") || "#007bff";
      });

      nlFileUploadArea.addEventListener("dragleave", () => {
        nlFileUploadArea.style.borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--border-color") || "#ddd";
      });

      nlFileUploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFileUpload(file, true);
        nlFileUploadArea.style.borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--border-color") || "#ddd";
      });

      nlCsvFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleFileUpload(file, true);
      });
    }
  }

  // ========================
  // Initialization
  // ========================
  
  /**
   * Initialize the application
   */
  function init() {
    detectCSVMode();
    setupTabSwitching();
    setupSyntaxHighlighting();
    setupEventListeners();
    setupDatabaseManagement();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();