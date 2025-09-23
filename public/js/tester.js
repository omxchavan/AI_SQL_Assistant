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

      // Initialize syntax highlighting
      function applySqlHighlighting(element) {
        element.classList.add("hljs");
        element.classList.add("language-sql");
        hljs.highlightElement(element);
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

      // Execute SQL query
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

        statusElement.textContent = "Executing query...";
        resultTableElement.innerHTML = "";

        if (responseEditorElement) {
          responseEditorElement.textContent = "";
        }

        try {
          const response = await fetch("/api/execute-sql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
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
                generatedSql.textContent = data.query;
                applySqlHighlighting(generatedSql);
                applySqlHighlighting(responseEditorElement);


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

        generatedSql.textContent = "Generating SQL...";
        executeGeneratedBtn.style.display = "none";
        copyGeneratedSql.style.display = "none";
        nlStatus.textContent = "";
        nlResponseTable.innerHTML = "";

        try {
          const response = await fetch("/api/generate-sql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
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
      // Database management - Delete all tables
      const deleteTablesBtn = document.getElementById("delete-tables-btn");
      const confirmDeleteDiv = document.getElementById("confirm-delete");
      const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
      const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
      const deleteStatus = document.getElementById("delete-status");

      // Show confirmation when delete button is clicked
      deleteTablesBtn.addEventListener("click", () => {
        confirmDeleteDiv.style.display = "block";
        deleteStatus.textContent = "";
      });

      // Cancel delete operation
      cancelDeleteBtn.addEventListener("click", () => {
        confirmDeleteDiv.style.display = "none";
      });

      // Confirm delete operation
      confirmDeleteBtn.addEventListener("click", async () => {
        try {
          deleteStatus.textContent = "Deleting tables...";

          const response = await fetch("/api/delete-all-tables", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ confirmation: "CONFIRM_DELETE" }),
          });

          const data = await response.json();

          if (data.success) {
            deleteStatus.textContent = data.message;
            // Clear any query results
            sqlResponseTable.innerHTML = "";
            nlResponseTable.innerHTML = "";
            sqlStatus.textContent = "";
            nlStatus.textContent = "";
          } else {
            deleteStatus.textContent = `Error: ${data.error}`;
          }
        } catch (error) {
          deleteStatus.textContent = `Error: ${error.message}`;
        } finally {
          confirmDeleteDiv.style.display = "none";
        }
      });

      // Initialize syntax highlighting on page load
      document.addEventListener("DOMContentLoaded", function () {
        setupSyntaxHighlighting();
      });