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
      const executeGeneratedBtn = document.getElementById(
        "execute-generated-btn"
      );
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
      const nlColumnPreviewBody = document.getElementById(
        "nl-column-preview-body"
      );
      const nlFileError = document.getElementById("nl-file-error");

      // Store uploaded CSV data
      let uploadedCsvData = null;
      let uploadedCsvFilename = null;

      // Initialize syntax highlighting
      // Initialize syntax highlighting
      function applySqlHighlighting(element) {
        element.classList.add("hljs", "language-sql");
        hljs.highlightAll();
      }

      // Apply highlighting to editors when content changes
      function setupSyntaxHighlighting() {
        // For SQL editor response
        sqlResponseEditor.addEventListener("input", function () {
          applySqlHighlighting(this);
        });

        // For generated SQL
        generatedSql.addEventListener("input", function () {
          applySqlHighlighting(this);
        });
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

      // Execute SQL query on CSV data
      async function executeQuery(
        query,
        statusElement,
        resultTableElement,
        responseEditorElement
      ) {
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

        if (responseEditorElement) {
          responseEditorElement.textContent = "";
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

              if (responseEditorElement) {
                responseEditorElement.textContent = query;
            
                applySqlHighlighting(responseEditorElement);
              }
            } else {
              const noResults = document.createElement("p");
              noResults.textContent =
                "Query executed successfully, but no results were returned.";
              resultTableElement.appendChild(noResults);
            }
          }
        } catch (error) {
          statusElement.textContent = `Error: ${error.message}`;
        }
      }

      // Execute direct SQL query
      executeBtn.addEventListener("click", () => {
        const query = sqlQuery.value.trim();
        executeQuery(query, sqlStatus, sqlResponseTable, sqlResponseEditor);
      });

      // Execute edited SQL from response
    

      // Generate SQL from natural language
      generateBtn.addEventListener("click", async () => {
        const prompt = nlQuery.value.trim();
        if (!prompt) {
          generatedSql.textContent = "Please enter a natural language query";
          return;
        }

        if (!uploadedCsvData) {
          generatedSql.textContent = "Please upload a CSV file first";
          return;
        }

        generatedSql.textContent = "Generating SQL...";
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
      });

      // Copy generated SQL
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

      // Execute generated SQL
      executeGeneratedBtn.addEventListener("click", () => {
        const query = generatedSql.textContent.trim();
        executeQuery(query, nlStatus, nlResponseTable);
      });

      // Example queries
      examples.forEach((example) => {
        example.addEventListener("click", () => {
          sqlQuery.value = example.getAttribute("data-query");
          // Auto-switch to direct SQL tab
          directTab.click();
        });
      });

      // Clear buttons
      clearSqlBtn.addEventListener("click", () => {
        sqlQuery.value = "";
        sqlStatus.textContent = "";
        sqlResponseTable.innerHTML = "";
        sqlResponseEditor.textContent = "";
   
      });

      clearNlBtn.addEventListener("click", () => {
        nlQuery.value = "";
        generatedSql.textContent = "";
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

      // File upload handling
      function handleFileUpload(file, isNlTab = false) {
        const errorElement = isNlTab ? nlFileError : fileError;

        // Reset error message
        errorElement.style.display = "none";
        errorElement.textContent = "";

        if (!file) {
          showError(errorElement, "Please select a file");
          return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
          showError(errorElement, "Please upload a CSV file");
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

            // Update UI
            updateFileInfo(
              file,
              parsedData.rows.length,
              parsedData.headers,
              parsedData.rows,
              isNlTab
            );
          } catch (error) {
            showError(errorElement, `Error parsing CSV: ${error.message}`);
          }
        };

        reader.onerror = function () {
          showError(errorElement, "Error reading file");
        };

        reader.readAsText(file);
      }

      function showError(element, message) {
        element.textContent = message;
        element.style.display = "block";
      }

      function updateFileInfo(file, rowCount, headers, rows, isNlTab = false) {
        const fileSize = Math.round(file.size / 1024);

        if (isNlTab) {
          nlFilenameSpan.textContent = file.name;
          nlFilesizeSpan.textContent = `${fileSize} KB`;
          nlColumnCountSpan.textContent = headers.length;
          nlRowCountSpan.textContent = rowCount;

          // Update column preview
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
        } else {
          filenameSpan.textContent = file.name;
          filesizeSpan.textContent = `${fileSize} KB`;
          columnCountSpan.textContent = headers.length;
          rowCountSpan.textContent = rowCount;

          // Update column preview
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
        }
      }

      // Set up file upload events
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
        handleFileUpload(file, false);
      });

      csvFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleFileUpload(file, false);
      });

      // Set up NL file upload events
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
        handleFileUpload(file, true);
      });

      nlCsvFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleFileUpload(file, true);
      });

      // Initialize syntax highlighting on page load
      document.addEventListener("DOMContentLoaded", function () {
        setupSyntaxHighlighting();
      });