// DOM elements
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

// Store uploaded CSV data
let uploadedCsvData = null;
let uploadedCsvFilename = null;

// CodeMirror SQL Keywords and Configuration
const sqlKeywords = [
  "SELECT","FROM","WHERE","INSERT","INTO","VALUES",
  "UPDATE","DELETE","JOIN","LEFT","RIGHT","ON","AS",
  "CREATE","TABLE","DROP","ALTER","INDEX","DISTINCT",
  "GROUP BY","ORDER BY","HAVING","LIMIT"
];
const tables = ["Books","Authors","Loans","Patrons","Genres"];
const functions = ["COUNT","SUM","AVG","MIN","MAX"];

// Dynamic column names from uploaded CSV
let csvColumns = [];
let csvTableName = "uploaded_csv"; // Default table name

function customSQLHint(cm) {
  const cursor = cm.getCursor();
  const token = cm.getTokenAt(cursor);
  const start = token.start;
  const end = cursor.ch;
  const word = token.string.slice(0, end - start);
  let list = [];
  
  // Match keywords
  sqlKeywords.forEach(k => {
    if (k.toLowerCase().startsWith(word.toLowerCase())) {
      list.push({text: k, className: "cm-hint-keyword"});
    }
  });
  
  // Match functions
  functions.forEach(f => {
    if (f.toLowerCase().startsWith(word.toLowerCase())) {
      list.push({text: f+"()", className: "cm-hint-func"});
    }
  });
  
  // Match tables (including CSV table name)
  const allTables = [...tables, csvTableName];
  allTables.forEach(t => {
    if (t.toLowerCase().startsWith(word.toLowerCase())) {
      list.push({text: t, className: "cm-hint-table"});
    }
  });
  
  // Match CSV columns if available
  csvColumns.forEach(c => {
    if (c.toLowerCase().startsWith(word.toLowerCase())) {
      list.push({text: c, className: "cm-hint-column"});
    }
  });
  
  return {
    list,
    from: CodeMirror.Pos(cursor.line, start),
    to: CodeMirror.Pos(cursor.line, end)
  };
}

// Initialize CodeMirror editor
let sqlEditor;
function initializeSQLEditor() {
  sqlEditor = CodeMirror.fromTextArea(document.getElementById("sql-query"), {
    mode: "text/x-sql",
    theme: "dracula",
    lineNumbers: true,
    matchBrackets: true,
    smartIndent: true,
    autofocus: true,
    extraKeys: {"Ctrl-Space": "autocomplete"}
  });
  
  sqlEditor.on("inputRead", function(cm, change) {
    if (change.text[0] && /[a-zA-Z.]/.test(change.text[0])) {
      cm.showHint({hint: customSQLHint, completeSingle: false});
    }
  });
}

// Initialize CodeMirror for generated SQL display
let generatedSqlEditor;
function initializeGeneratedSQLEditor() {
  if (generatedSql.tagName.toLowerCase() === 'textarea') {
    generatedSqlEditor = CodeMirror.fromTextArea(generatedSql, {
      mode: "text/x-sql",
      theme: "dracula",
      lineNumbers: true,
      readOnly: true
    });
  } else {
    // If it's a div or pre, convert to CodeMirror
    const textarea = document.createElement('textarea');
    textarea.id = 'generated-sql-textarea';
    generatedSql.parentNode.replaceChild(textarea, generatedSql);
    
    generatedSqlEditor = CodeMirror.fromTextArea(textarea, {
      mode: "text/x-sql",
      theme: "dracula",
      lineNumbers: true,
      readOnly: true
    });
  }
}

// Initialize CodeMirror for response editor
let responseEditor;
function initializeResponseEditor() {
  if (sqlResponseEditor.tagName.toLowerCase() === 'textarea') {
    responseEditor = CodeMirror.fromTextArea(sqlResponseEditor, {
      mode: "text/x-sql",
      theme: "dracula",
      lineNumbers: true,
      matchBrackets: true,
      smartIndent: true,
      extraKeys: {"Ctrl-Space": "autocomplete"}
    });
    
    responseEditor.on("inputRead", function(cm, change) {
      if (change.text[0] && /[a-zA-Z.]/.test(change.text[0])) {
        cm.showHint({hint: customSQLHint, completeSingle: false});
      }
    });
  }
}

// Tab switching
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

// Helper function to create an HTML table from JSON data
function createTable(data) {
  const container = document.createElement("div");
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
  container.appendChild(tableElement);

  // Create Export to CSV button
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export to CSV";
  exportBtn.style.marginTop = "10px";
  exportBtn.style.marginBottom = "25px";
  exportBtn.addEventListener("click", () => {
    exportTableToCSV(data.results, "query_results.csv");
  });

  container.appendChild(exportBtn);
  return container;
}

//Export to CSV function
function exportTableToCSV(jsonData, filename) {
  if (!jsonData || jsonData.length === 0) return;

  const columnNames = Object.keys(jsonData[0]);
  const csvRows = [];

  // Header
  csvRows.push(columnNames.join(","));

  // Rows
  jsonData.forEach((row) => {
    const values = columnNames.map((col) =>
      row[col] !== null ? `"${row[col]}"` : "NULL"
    );
    csvRows.push(values.join(","));
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Execute SQL query on CSV data
async function executeQuery(query, statusElement, resultTableElement, responseEditorElement) {
  if (!query) {
    statusElement.textContent = "Please enter a SQL query";
    return;
  }

  if (!uploadedCsvData) {
    statusElement.textContent = "Please upload a CSV file first";
    return;
  }

  statusElement.textContent = "Executing query...";
  resultTableElement.innerHTML = "";

  if (responseEditorElement && responseEditor) {
    responseEditor.setValue("");
  }

  try {
    const response = await fetch("/api/execute-csv-sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        csvData: uploadedCsvData,
        filename: uploadedCsvFilename,
      }),
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

          const tableData = {
            results: result.results,
          };

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

        if (responseEditorElement && responseEditor) {
          responseEditor.setValue(query);
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

// Execute direct SQL query
executeBtn.addEventListener("click", () => {
  const query = sqlEditor ? sqlEditor.getValue().trim() : sqlQuery.value.trim();
  executeQuery(query, sqlStatus, sqlResponseTable, sqlResponseEditor);
});

// Generate SQL from natural language
generateBtn.addEventListener("click", async () => {
  const prompt = nlQuery.value.trim();
  if (!prompt) {
    if (generatedSqlEditor) {
      generatedSqlEditor.setValue("Please enter a natural language query");
    } else {
      generatedSql.textContent = "Please enter a natural language query";
    }
    return;
  }

  if (!uploadedCsvData) {
    if (generatedSqlEditor) {
      generatedSqlEditor.setValue("Please upload a CSV file first");
    } else {
      generatedSql.textContent = "Please upload a CSV file first";
    }
    return;
  }

  if (generatedSqlEditor) {
    generatedSqlEditor.setValue("Generating SQL...");
  } else {
    generatedSql.textContent = "Generating SQL...";
  }
  
  executeGeneratedBtn.style.display = "none";
  copyGeneratedSql.style.display = "none";
  nlStatus.textContent = "";
  nlResponseTable.innerHTML = "";

  try {
    const response = await fetch("/api/generate-csv-sql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        csvData: uploadedCsvData,
        filename: uploadedCsvFilename,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      if (generatedSqlEditor) {
        generatedSqlEditor.setValue(`Error: ${data.error}`);
      } else {
        generatedSql.textContent = `Error: ${data.error}`;
      }
      return;
    }

    if (generatedSqlEditor) {
      generatedSqlEditor.setValue(data.query);
    } else {
      generatedSql.textContent = data.query;
    }
    
    executeGeneratedBtn.style.display = "block";
    copyGeneratedSql.style.display = "block";
  } catch (error) {
    if (generatedSqlEditor) {
      generatedSqlEditor.setValue(`Error: ${error.message}`);
    } else {
      generatedSql.textContent = `Error: ${error.message}`;
    }
  }
});

// Copy generated SQL
copyGeneratedSql.addEventListener("click", () => {
  const text = generatedSqlEditor ? generatedSqlEditor.getValue() : generatedSql.textContent;
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

// Execute generated SQL
executeGeneratedBtn.addEventListener("click", () => {
  const query = generatedSqlEditor ? generatedSqlEditor.getValue().trim() : generatedSql.textContent.trim();
  executeQuery(query, nlStatus, nlResponseTable);
});

// Example queries
examples.forEach((example) => {
  example.addEventListener("click", () => {
    const queryText = example.getAttribute("data-query");
    if (sqlEditor) {
      sqlEditor.setValue(queryText);
    } else {
      sqlQuery.value = queryText;
    }
    // Auto-switch to direct SQL tab
    directTab.click();
  });
});

// Clear buttons
clearSqlBtn.addEventListener("click", () => {
  if (sqlEditor) {
    sqlEditor.setValue("");
  } else {
    sqlQuery.value = "";
  }
  sqlStatus.textContent = "";
  sqlResponseTable.innerHTML = "";
  if (responseEditor) {
    responseEditor.setValue("");
  } else {
    sqlResponseEditor.textContent = "";
  }
});

clearNlBtn.addEventListener("click", () => {
  nlQuery.value = "";
  if (generatedSqlEditor) {
    generatedSqlEditor.setValue("");
  } else {
    generatedSql.textContent = "";
  }
  nlStatus.textContent = "";
  nlResponseTable.innerHTML = "";
  executeGeneratedBtn.style.display = "none";
  copyGeneratedSql.style.display = "none";
});

// Improved CSV parsing function
function parseCSV(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row"
    );
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

// Helper function to parse a single CSV line
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

// Updated function to sync file info across both tabs
function updateAllFileInfo(file, rowCount, headers, rows) {
  const fileSize = Math.round(file.size / 1024);

  // Update Direct SQL tab file info
  filenameSpan.textContent = file.name;
  filesizeSpan.textContent = `${fileSize} KB`;
  columnCountSpan.textContent = headers.length;
  rowCountSpan.textContent = rowCount;

  // Update column preview for Direct SQL tab
  columnPreviewBody.innerHTML = "";
  headers.forEach((header, index) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    const tdSample = document.createElement("td");

    tdName.textContent = header;
    tdSample.textContent =
      rows[0] && rows[0][header]
        ? rows[0][header].length > 50
          ? rows[0][header].substring(0, 50) + "..."
          : rows[0][header]
        : "N/A";

    tr.appendChild(tdName);
    tr.appendChild(tdSample);
    columnPreviewBody.appendChild(tr);
  });

  fileInfo.classList.add("visible");
  fileUploadArea.classList.add("active");

  // Update NL tab file info
  nlFilenameSpan.textContent = file.name;
  nlFilesizeSpan.textContent = `${fileSize} KB`;
  nlColumnCountSpan.textContent = headers.length;
  nlRowCountSpan.textContent = rowCount;

  // Update column preview for NL tab
  nlColumnPreviewBody.innerHTML = "";
  headers.forEach((header, index) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    const tdSample = document.createElement("td");

    tdName.textContent = header;
    tdSample.textContent =
      rows[0] && rows[0][header]
        ? rows[0][header].length > 50
          ? rows[0][header].substring(0, 50) + "..."
          : rows[0][header]
        : "N/A";

    tr.appendChild(tdName);
    tr.appendChild(tdSample);
    nlColumnPreviewBody.appendChild(tr);
  });

  nlFileInfo.classList.add("visible");
  nlFileUploadArea.classList.add("active");
}

// Unified file upload handling
function handleFileUpload(file) {
  // Reset error messages for both tabs
  fileError.style.display = "none";
  fileError.textContent = "";
  nlFileError.style.display = "none";
  nlFileError.textContent = "";

  if (!file) {
    showError(fileError, "Please select a file");
    showError(nlFileError, "Please select a file");
    return;
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    showError(fileError, "Please upload a CSV file");
    showError(nlFileError, "Please upload a CSV file");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const csvData = e.target.result;
      const parsedData = parseCSV(csvData);

      // Store the parsed data
      uploadedCsvData = parsedData;
      uploadedCsvFilename = file.name;
      
      // Update CSV columns for autocomplete
      csvColumns = parsedData.headers;
      
      // Set CSV table name (remove .csv extension and replace spaces/special chars with underscores)
      csvTableName = file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');

      // Update UI for both tabs
      updateAllFileInfo(file, parsedData.rows.length, parsedData.headers, parsedData.rows);
    } catch (error) {
      showError(fileError, `Error parsing CSV: ${error.message}`);
      showError(nlFileError, `Error parsing CSV: ${error.message}`);
    }
  };

  reader.onerror = function () {
    showError(fileError, "Error reading file");
    showError(nlFileError, "Error reading file");
  };

  reader.readAsText(file);
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";
}

// Set up file upload events for Direct SQL tab
fileUploadArea.addEventListener("click", () => {
  csvFileInput.click();
});

fileUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileUploadArea.style.borderColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--primary-color");
});

fileUploadArea.addEventListener("dragleave", () => {
  fileUploadArea.style.borderColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--border-color");
});

fileUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  handleFileUpload(file);
});

csvFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handleFileUpload(file);
});

// Set up file upload events for NL tab
nlFileUploadArea.addEventListener("click", () => {
  nlCsvFileInput.click();
});

nlFileUploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  nlFileUploadArea.style.borderColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--primary-color");
});

nlFileUploadArea.addEventListener("dragleave", () => {
  nlFileUploadArea.style.borderColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--border-color");
});

nlFileUploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  handleFileUpload(file);
});

nlCsvFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handleFileUpload(file);
});

// Global paste event handler
document.addEventListener("paste", (e) => {
  // Prevent default paste into text fields if needed
  e.preventDefault();

  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) {
        handleFileUpload(file);
      }
    }
  }
});

// Initialize CodeMirror editors on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeSQLEditor();
  initializeGeneratedSQLEditor();
  initializeResponseEditor();
});