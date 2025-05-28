const fileInput = document.getElementById("file-input");
fileInput.addEventListener("click", () => {
  fileInput.value = "";
  clearMessage();
  hideDownloadButton();
});
const messageDisplay = document.getElementById("message");

fileInput.addEventListener("change", handleFileSelection);

async function readXsl() {
  const response = await fetch("/assets/scripts/mra2beeline/beeline.xsl");
  const xslText = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(xslText, "application/xml");
}

// Displays a message to the user
function showMessage(message, type) {
  messageDisplay.textContent = message;
  messageDisplay.style.color = type === "error" ? "red" : "green";
}

function createDownloadButton(resultString, fileName) {
  const blob = new Blob([resultString], { type: "application/xml" });
  const url = URL.createObjectURL(blob);

  document.getElementById("download-container").innerHTML = ""; // Clear previous

  const downloadButton = document.createElement("button");
  downloadButton.textContent = "Download";
  downloadButton.id = "download-button";
  document.getElementById("download-container").appendChild(downloadButton);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = createNewFileName(fileName);

  document.getElementById("download-button").addEventListener("click", () => {
    downloadLink.click();
    hideDownloadButton();
    clearMessage();
    fileInput.value = "";
    showMessage("Done. Would you like to convert another gpx?", "success");
  });
}

function hideDownloadButton() {
  document.getElementById("download-container").innerHTML = "";
}

function createNewFileName(fileName) {
  const namePart = fileName.replace(/\.gpx$/i, "");
  return `${namePart} transformed.gpx`;
}
function clearMessage() {
  messageDisplay.textContent = "";
}

function handleFileSelection(event) {
  const file = event.target.files[0];
  const fileName = file.name;

  // Clear previous messages, buttons and files
  hideDownloadButton();
  clearMessage();

  // Validate file existence and type
  if (!file) {
    fileNameDisplay.textContent = "";
    hideDownloadButton();
    showMessage("No file selected. Please choose a file.", "error");
    return;
  }

  if (!file.name.toLowerCase().endsWith(".gpx")) {
    showMessage("Unsupported file type. Please select a .gpx file.", "error");
    return;
  }

  // Read and transform the file
  const reader = new FileReader();
  reader.onload = async () => {
    const fileText = reader.result;
    // fileContentDisplay.textContent = fileText;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileText, "application/xml");
      const xsltDoc = await readXsl();

      const xsltProcessor = new XSLTProcessor();
      xsltProcessor.importStylesheet(xsltDoc);

      // Perform the transformation, returning the result as a new XML document
      const resultDoc = xsltProcessor.transformToDocument(xmlDoc);

      // Serialize the result document to a string
      const serializer = new XMLSerializer();
      const resultString = serializer.serializeToString(resultDoc);

      createDownloadButton(resultString, fileName);
      showMessage("File transformed successfully.", "success");
    } catch (err) {
      console.error("Transformation error:", err);
      showMessage("Error transforming the file.", "error");
    }
  };
  reader.onerror = () => {
    showMessage("Error reading the file. Please try again.", "error");
  };
  reader.readAsText(file);
}
