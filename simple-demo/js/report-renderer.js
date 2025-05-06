/**
 * Report Renderer Module for Mood Notetaker
 * Generates and renders post-interview reports
 */

/**
 * Generate a report for an interview session
 * @param {Object} interviewConfig The interview configuration
 */
async function generateReport(interviewConfig) {
  console.log('Generating report for interview');
  
  // Show loading indicator
  const reportContainer = getOrCreateReportContainer();
  reportContainer.innerHTML = '<div class="report-loading">Generating interview report...</div>';
  
  try {
    // Get the interview data
    const interviewData = collectInterviewData(interviewConfig);
    
    // Get the formatted transcript text
    const transcriptText = formatTranscriptForEvaluation(interviewData.fullTranscript);
    
    // Use evaluation from report-generator.js if available
    if (typeof evaluateWithGPT === 'function') {
      console.log('Using report-generator.js evaluation with GPT');
      
      // Get interview details from config
      const role = interviewConfig.role || 'unspecified role';
      const company = interviewConfig.company || 'unspecified company';
      const focus = interviewConfig.focus || 'general interview topics';
      
      // Generate the evaluation with GPT
      const reportMarkdown = await evaluateWithGPT(transcriptText, role, company, focus);
      
      // Render the report
      renderReport(reportMarkdown);
      return reportMarkdown;
    } else {
      // Fall back to the original report generation
      console.log('Falling back to original report generation');
      const reportMarkdown = await generateReportWithOpenAI(interviewData);
      renderReport(reportMarkdown);
      return reportMarkdown;
    }
  } catch (error) {
    console.error('Error generating report:', error);
    reportContainer.innerHTML = `<div class="report-error">Error generating report: ${error.message}</div>`;
    return null;
  }
}

/**
 * Get or create a container for the report
 * @returns {HTMLElement} The report container
 */
function getOrCreateReportContainer() {
  let reportContainer = document.getElementById('report-container');
  
  if (!reportContainer) {
    // Create a report container
    reportContainer = document.createElement('div');
    reportContainer.id = 'report-container';
    reportContainer.className = 'report-container';
    
    // Add to the DOM
    document.body.appendChild(reportContainer);
  }
  
  // Show the container
  reportContainer.style.display = 'block';
  
  return reportContainer;
}

/**
 * Format the full transcript for evaluation
 * @param {Array} fullTranscript - Array of transcript entries
 * @returns {string} Formatted transcript text
 */
function formatTranscriptForEvaluation(fullTranscript) {
  if (!fullTranscript || !Array.isArray(fullTranscript) || fullTranscript.length === 0) {
    return "No transcript available";
  }
  
  // Sort by timestamp if available
  const sortedTranscript = [...fullTranscript].sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
    return 0;
  });
  
  // Format into text
  return sortedTranscript.map(entry => {
    const role = entry.role === 'interviewer' ? '[Interviewer]' : '[Candidate]';
    return `${role}: ${entry.text}`;
  }).join('\n\n');
}

/**
 * Collect data about the interview
 * @param {Object} interviewConfig The interview configuration
 * @returns {Object} Interview data for the report
 */
function collectInterviewData(interviewConfig) {
  // Get transcript data from interviewAgentState if available
  let fullTranscript = [];
  
  // Debug transcript availability
  console.log("Checking transcript sources");
  
  // First try the direct window reference which should be the most reliable
  if (window.interviewAgentState) {
    console.log("Found interviewAgentState on window object");
    if (Array.isArray(window.interviewAgentState.fullTranscript) && window.interviewAgentState.fullTranscript.length > 0) {
      console.log(`Using window.interviewAgentState.fullTranscript with ${window.interviewAgentState.fullTranscript.length} entries`);
      fullTranscript = window.interviewAgentState.fullTranscript;
    } else {
      console.log("window.interviewAgentState.fullTranscript is empty or not an array");
    }
  } else {
    console.log("No interviewAgentState found on window object");
  }
  
  // If we still don't have a transcript, look at other possible locations
  if (fullTranscript.length === 0) {
    console.warn('No interviewAgentState.fullTranscript available - using fallback');
    
    // Try to grab transcript from the DOM
    const transcriptElement = document.getElementById('transcript');
    const transcript = transcriptElement ? transcriptElement.innerText : '';
    
    if (transcript && transcript.length > 50) {
      console.log("Using DOM transcript as fallback");
      
      // Convert DOM transcript to an array of entries
      const lines = transcript.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        // Try to parse the line format "[Role]: Text"
        const match = line.match(/\[(.*?)\]:\s*(.*)/);
        if (match) {
          const roleText = match[1];
          const text = match[2];
          
          // Determine the role
          let role = 'system';
          if (roleText.toLowerCase().includes('interviewer')) {
            role = 'interviewer';
          } else if (roleText.toLowerCase().includes('candidate')) {
            role = 'candidate';
          }
          
          fullTranscript.push({
            role: role,
            text: text,
            timestamp: new Date().toISOString() // We don't have real timestamps, so use current time
          });
        }
      }
      
      console.log(`Created transcript array with ${fullTranscript.length} entries from DOM`);
    }
  }
  
  // Get mood data if available
  let emotions = [];
  if (window.exporter && window.exporter.emotions) {
    emotions = window.exporter.emotions;
  }
  
  // Get summary if available
  const summaryElement = document.getElementById('summary');
  const summary = summaryElement ? summaryElement.innerText : '';
  
  // Combine data
  return {
    config: interviewConfig,
    transcript: document.getElementById('transcript') ? document.getElementById('transcript').innerText : '',
    fullTranscript: fullTranscript,
    emotions: emotions,
    summary: summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate a report using OpenAI
 * @param {Object} interviewData Data about the interview
 * @returns {Promise<string>} The generated report in markdown format
 */
async function generateReportWithOpenAI(interviewData) {
  // Check if OpenAI API key is available
  if (!config.openaiApiKey) {
    return generateFallbackReport(interviewData);
  }
  
  try {
    // Create prompt for OpenAI
    const prompt = `
Act as a candid hiring manager. Below is the full interview transcript and emotion timeline.
Give the candidate specific feedback on content, structure, and delivery.
Return a markdown report with: ✅ Strengths | ⚠️ Areas to improve | 🎯 Next-steps.`;

    // Make API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: JSON.stringify(interviewData) }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error('No content returned from OpenAI API');
    }
  } catch (error) {
    console.error('Error generating report with OpenAI:', error);
    // Fall back to a basic report
    return generateFallbackReport(interviewData);
  }
}

/**
 * Generate a basic report without OpenAI
 * @param {Object} interviewData Data about the interview
 * @returns {string} A basic report in markdown format
 */
function generateFallbackReport(interviewData) {
  const { config, summary } = interviewData;
  
  return `# Interview Report

## Interview for ${config.role} at ${config.company}

${summary || 'No summary available'}

### Feedback

#### ✅ Strengths
- You completed the full interview session
- You provided coherent responses to questions

#### ⚠️ Areas to Improve
- Consider preparing more specific examples for common interview questions
- Practice more concise answers to technical questions

#### 🎯 Next Steps
- Review the full transcript to identify areas for improvement
- Practice with additional mock interviews focusing on similar questions
- Research ${config.company} more deeply for your next interview

*This is a basic automated report. For more detailed feedback, please ensure OpenAI integration is configured properly.*`;
}

/**
 * Render a markdown report in the UI
 * @param {string} markdown The report in markdown format
 */
function renderReport(markdown) {
  // Get the report container
  const reportContainer = getOrCreateReportContainer();
  
  // Create the report content
  const reportContent = document.createElement('div');
  reportContent.className = 'report-content';
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'report-close';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => {
    reportContainer.style.display = 'none';
  };
  
  // Convert markdown to HTML (simple version)
  let html = convertMarkdownToHtml(markdown);
  
  // Add content
  reportContent.innerHTML = html;
  
  // Clear and populate container
  reportContainer.innerHTML = '';
  reportContainer.appendChild(closeButton);
  reportContainer.appendChild(reportContent);
  
  // Make sure the container is visible
  reportContainer.style.display = 'block';
}

/**
 * Simple markdown to HTML converter
 * @param {string} markdown Markdown text
 * @returns {string} HTML
 */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Headers
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  
  // Wrap lists
  html = html.replace(/<\/li>\n<li>/g, '</li><li>');
  
  // Unordered lists
  let parts = html.split(/<li>/);
  for (let i = 1; i < parts.length; i++) {
    if (!parts[i].includes('</li>')) continue;
    
    // Check if we're at the start of an unordered list
    if (i === 1 || !parts[i-1].includes('</li>')) {
      parts[i] = '<ul><li>' + parts[i];
    } else {
      parts[i] = '<li>' + parts[i];
    }
    
    // Check if we're at the end of an unordered list
    if (i === parts.length - 1 || !parts[i+1].includes('</li>')) {
      parts[i] = parts[i].replace('</li>', '</li></ul>');
    }
  }
  html = parts.join('');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  
  // Paragraphs - add paragraph tags to lines that aren't already wrapped
  const lines = html.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('<') && !line.endsWith('>')) {
      lines[i] = '<p>' + line + '</p>';
    }
  }
  html = lines.join('\n');
  
  return html;
}

// Add CSS for the report
function addReportStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .report-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 800px;
      max-height: 90vh;
      background: var(--card-bg, #1e1e1e);
      border: 1px solid var(--card-border, #333);
      border-radius: var(--border-radius, 8px);
      box-shadow: var(--shadow, 0 4px 20px rgba(0, 0, 0, 0.6));
      z-index: 1000;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      padding: 20px 30px;
      display: none;
      color: var(--text-primary, #f1f1f1);
    }
    
    .report-close {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: var(--text-primary, #f1f1f1);
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .report-close:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    .report-content {
      color: var(--text-primary, #f1f1f1);
      line-height: 1.6;
    }
    
    .report-content h1 {
      font-size: 28px;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 10px;
      color: var(--text-primary, #f1f1f1);
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .report-content h2 {
      font-size: 22px;
      margin: 25px 0 15px;
      color: var(--text-primary, #f1f1f1);
      text-transform: none;
      letter-spacing: normal;
      position: relative;
      font-weight: 600;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .report-content h3 {
      font-size: 20px;
      margin: 20px 0 12px;
      color: var(--text-secondary, #aaa);
      font-weight: 500;
    }
    
    .report-content h4 {
      font-size: 18px;
      margin: 15px 0 10px;
      color: var(--text-secondary, #aaa);
      font-weight: 500;
    }
    
    .report-content ul {
      margin: 15px 0;
      padding-left: 25px;
    }
    
    .report-content li {
      margin: 8px 0;
      position: relative;
    }
    
    .report-content li:before {
      content: '•';
      color: var(--text-secondary, #aaa);
      font-weight: bold;
      position: absolute;
      left: -18px;
    }
    
    .report-content strong {
      color: var(--text-primary, #f1f1f1);
      font-weight: 600;
    }
    
    .report-content em {
      font-style: italic;
      color: var(--text-secondary, #aaa);
    }
    
    .report-content p {
      margin: 12px 0;
    }
    
    .report-loading {
      text-align: center;
      padding: 30px;
      font-style: italic;
      color: var(--text-secondary, #aaa);
    }
    
    .report-error {
      text-align: center;
      padding: 30px;
      color: rgba(231, 76, 60, 0.8);
    }
    
    .report-content hr {
      border: none;
      border-top: 1px solid var(--card-border, #333);
      margin: 20px 0;
    }
    
    .report-content a {
      color: var(--text-secondary, #aaa);
      text-decoration: underline;
      transition: color 0.2s ease;
    }
    
    .report-content a:hover {
      color: var(--text-primary, #f1f1f1);
    }
  `;
  document.head.appendChild(style);
}

// Add report styles when the page loads
document.addEventListener('DOMContentLoaded', addReportStyles);

// Export functions for use in other modules
window.generateReport = generateReport;
window.renderReport = renderReport;
window.getOrCreateReportContainer = getOrCreateReportContainer; 