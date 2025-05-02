/**
 * Notes Uploader Module for Mood Notetaker
 * Handles uploading and displaying speaker notes (PDF, DOCX, TXT)
 */

class NotesUploader {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.notesContent = '';
    this.init();
  }

  /**
   * Initialize the notes uploader
   */
  init() {
    // Create the notes container if not exists
    if (!this.container) {
      console.error('Notes container not found');
      return;
    }

    // Create the uploader UI
    this.createUploaderUI();

    // Load required libraries
    this.loadDependencies();
  }

  /**
   * Create the uploader UI
   */
  createUploaderUI() {
    const uploaderHTML = `
      <div class="notes-uploader">
        <h2><i class="fas fa-file-alt"></i> Speaker Notes</h2>
        <div class="notes-input-container">
          <label for="notes-file" class="notes-file-label">
            <i class="fas fa-upload"></i> Upload Notes
          </label>
          <input type="file" id="notes-file" accept=".txt,.pdf,.docx" />
          <span class="notes-file-info">Supports TXT, PDF, and DOCX</span>
        </div>
        <div class="notes-content" id="notes-content">
          <p class="notes-placeholder">Your speaker notes will appear here...</p>
        </div>
      </div>
    `;

    this.container.innerHTML = uploaderHTML;

    // Add event listeners
    const fileInput = document.getElementById('notes-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
  }

  /**
   * Load required dependencies for PDF and DOCX parsing
   */
  loadDependencies() {
    // Load PDF.js for PDF parsing
    if (!window.pdfjsLib) {
      const pdfScript = document.createElement('script');
      pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.min.js';
      document.head.appendChild(pdfScript);
    }

    // Load Mammoth.js for DOCX parsing
    if (!window.mammoth) {
      const mammothScript = document.createElement('script');
      mammothScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.19/mammoth.browser.min.js';
      document.head.appendChild(mammothScript);
    }
  }

  /**
   * Handle file upload event
   * @param {Event} event The file input change event
   */
  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const notesContentEl = document.getElementById('notes-content');
    if (notesContentEl) {
      notesContentEl.innerHTML = '<p>Processing file...</p>';
    }

    const fileType = file.name.split('.').pop().toLowerCase();

    switch (fileType) {
      case 'txt':
        this.processTxtFile(file);
        break;
      case 'pdf':
        this.processPdfFile(file);
        break;
      case 'docx':
        this.processDocxFile(file);
        break;
      default:
        this.showError('Unsupported file type');
    }
  }

  /**
   * Process a TXT file
   * @param {File} file The TXT file to process
   */
  processTxtFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.notesContent = e.target.result;
      this.displayNotes(this.notesContent);
    };
    reader.onerror = () => {
      this.showError('Error reading TXT file');
    };
    reader.readAsText(file);
  }

  /**
   * Process a PDF file
   * @param {File} file The PDF file to process
   */
  processPdfFile(file) {
    // Wait for PDF.js to load
    const checkPdfJs = () => {
      if (window.pdfjsLib) {
        this.extractPdfText(file);
      } else {
        setTimeout(checkPdfJs, 100);
      }
    };
    checkPdfJs();
  }

  /**
   * Extract text from a PDF file
   * @param {File} file The PDF file
   */
  extractPdfText(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        
        // Initialize PDF.js
        const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        
        let extractedText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          extractedText += pageText + '\n\n';
        }
        
        this.notesContent = extractedText;
        this.displayNotes(extractedText);
      } catch (error) {
        console.error('PDF extraction error:', error);
        this.showError('Error extracting text from PDF');
      }
    };
    reader.onerror = () => {
      this.showError('Error reading PDF file');
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Process a DOCX file
   * @param {File} file The DOCX file to process
   */
  processDocxFile(file) {
    // Wait for Mammoth.js to load
    const checkMammoth = () => {
      if (window.mammoth) {
        this.extractDocxText(file);
      } else {
        setTimeout(checkMammoth, 100);
      }
    };
    checkMammoth();
  }

  /**
   * Extract text from a DOCX file
   * @param {File} file The DOCX file
   */
  extractDocxText(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        this.notesContent = result.value;
        this.displayNotes(result.value);
      } catch (error) {
        console.error('DOCX extraction error:', error);
        this.showError('Error extracting text from DOCX');
      }
    };
    reader.onerror = () => {
      this.showError('Error reading DOCX file');
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Display the extracted notes
   * @param {string} text The notes text to display
   */
  displayNotes(text) {
    const notesContentEl = document.getElementById('notes-content');
    if (notesContentEl) {
      // Format the text with improved formatting
      let formattedText = text;
      
      // Identify and format slide titles (lines with "Slide" followed by a number)
      formattedText = formattedText.replace(/\b(Slide\s+\d+[:.]\s*)/gi, '<strong class="slide-title">$1</strong>');
      
      // Format bullet points
      formattedText = formattedText.replace(/^[\s•\-*]+(.+)$/gm, '<li>$1</li>');
      formattedText = formattedText.replace(/<li>(.+)<\/li>/g, '<ul><li>$1</li></ul>');
      
      // Replace multiple consecutive <ul> tags with a single one
      formattedText = formattedText.replace(/<\/ul>\s*<ul>/g, '');
      
      // Identify and format paragraph breaks
      formattedText = formattedText.replace(/\n{2,}/g, '</p><p>');
      
      // Replace line breaks with <br> tags
      formattedText = formattedText.replace(/\n/g, '<br>');
      
      // Replace multiple spaces with non-breaking spaces
      formattedText = formattedText.replace(/\s{2,}/g, '&nbsp;&nbsp;');
      
      // Wrap everything in paragraphs
      formattedText = `<p>${formattedText}</p>`;
      
      notesContentEl.innerHTML = formattedText || '<p>No content found in file</p>';
      
      // Add custom styling
      const style = document.createElement('style');
      style.textContent = `
        .slide-title {
          display: block;
          margin-top: 16px;
          margin-bottom: 8px;
          font-size: 18px;
          color: #d4af37;
        }
        #notes-content p {
          margin-bottom: 12px;
        }
        #notes-content ul {
          margin-left: 20px;
          margin-bottom: 12px;
        }
        #notes-content li {
          margin-bottom: 4px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Show an error message
   * @param {string} message The error message
   */
  showError(message) {
    const notesContentEl = document.getElementById('notes-content');
    if (notesContentEl) {
      notesContentEl.innerHTML = `<p class="notes-error">${message}</p>`;
    }
    console.error(message);
  }

  /**
   * Get the current notes content
   * @returns {string} The notes content
   */
  getNotes() {
    return this.notesContent;
  }
}

// Export the NotesUploader class
window.NotesUploader = NotesUploader; 