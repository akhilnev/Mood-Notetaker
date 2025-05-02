/**
 * Text Highlighter Module for Mood Notetaker
 * Highlights recently spoken words in transcript
 */

class TextHighlighter {
  constructor() {
    this.lastText = '';
    this.highlightClass = 'highlight-pulse';
    this.sentenceRegex = /[^.!?]+[.!?]+/g;
  }

  /**
   * Highlight the newly added text in a transcript
   * @param {string} text The full transcript text
   * @param {HTMLElement} element The element to update with highlighted text
   * @returns {string} The highlighted HTML
   */
  highlightNewText(text, element) {
    // If this is our first time, just return the text
    if (!this.lastText) {
      this.lastText = text;
      return text;
    }

    // Find what text is new
    const newText = this.findNewText(text);
    if (!newText) return text;

    // Create the highlighted HTML
    const highlightedHtml = this.createHighlightedHtml(text, newText);
    
    // Update the last text for next time
    this.lastText = text;
    
    // Return the highlighted HTML
    return highlightedHtml;
  }

  /**
   * Find the newly added text in the transcript
   * @param {string} text The full current transcript
   * @returns {string} The newly added text
   */
  findNewText(text) {
    // Simple approach: if the new text starts with the old text, return the difference
    if (text.startsWith(this.lastText)) {
      return text.substring(this.lastText.length);
    }
    
    // More complex approach: find the last sentence in the text
    const sentences = text.match(this.sentenceRegex) || [];
    if (sentences.length > 0) {
      return sentences[sentences.length - 1].trim();
    }
    
    // Fallback: if we can't find a clear new part, return empty string
    return '';
  }

  /**
   * Create HTML with the latest text highlighted
   * @param {string} fullText The full transcript text
   * @param {string} newText The newly added text to highlight
   * @returns {string} HTML with highlight spans
   */
  createHighlightedHtml(fullText, newText) {
    // If newText is empty or not found in fullText, return the original
    if (!newText || !fullText.includes(newText)) {
      return fullText;
    }
    
    // Find the position of the new text in the full text
    const lastIndex = fullText.lastIndexOf(newText);
    
    // Split the text into parts
    const beforeText = fullText.substring(0, lastIndex);
    const afterText = fullText.substring(lastIndex + newText.length);
    
    // Return the HTML with highlight
    return `${beforeText}<span class="${this.highlightClass}">${newText}</span>${afterText}`;
  }

  /**
   * Process transcript paragraph elements
   * @param {HTMLElement} container The container of paragraph elements
   */
  processTranscriptParagraphs(container) {
    const paragraphs = container.querySelectorAll('p');
    if (paragraphs.length === 0) return;
    
    // Get the last paragraph
    const lastParagraph = paragraphs[paragraphs.length - 1];
    
    // Remove pulse class from all paragraphs
    paragraphs.forEach(p => p.classList.remove(this.highlightClass));
    
    // Add pulse class to the last paragraph
    lastParagraph.classList.add(this.highlightClass);
  }

  /**
   * Reset the highlighter state
   */
  reset() {
    this.lastText = '';
  }
}

// Export the TextHighlighter class
window.TextHighlighter = TextHighlighter; 