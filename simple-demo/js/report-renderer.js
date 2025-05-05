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
  if (window.interviewAgentState && window.interviewAgentState.fullTranscript) {
    fullTranscript = window.interviewAgentState.fullTranscript;
  }
  
  // Get transcript from DOM as fallback
  const transcriptElement = document.getElementById('transcript');
  const transcript = transcriptElement ? transcriptElement.innerText : '';
  
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
    transcript: transcript,
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
  
  // Wrap lists
  html = html.replace(/<\/li>\n<li>/g, '</li><li>');
  html = html.replace(/<li>(.*?)<\/li>/g, function(match) {
    if (match.indexOf('<li>') === 0 && match.lastIndexOf('</li>') === match.length - 5) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
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
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      z-index: 1000;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      padding: 20px;
      display: none;
    }
    
    .report-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.2);
      border: none;
      color: var(--text-primary);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    
    .report-close:hover {
      background: rgba(0, 0, 0, 0.4);
    }
    
    .report-content {
      color: var(--text-primary);
    }
    
    .report-content h1 {
      font-size: 24px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 10px;
    }
    
    .report-content h2 {
      font-size: 20px;
      margin: 15px 0;
      text-transform: none;
      letter-spacing: normal;
    }
    
    .report-content h3 {
      font-size: 18px;
      margin: 15px 0 10px;
      color: var(--text-secondary);
    }
    
    .report-content h4 {
      font-size: 16px;
      margin: 10px 0;
      color: var(--text-secondary);
    }
    
    .report-content ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    .report-content li {
      margin: 5px 0;
    }
    
    .report-loading {
      text-align: center;
      padding: 20px;
      font-style: italic;
      color: var(--text-secondary);
    }
    
    .report-error {
      text-align: center;
      padding: 20px;
      color: #e74c3c;
    }
  `;
  document.head.appendChild(style);
}

// Add report styles when the page loads
document.addEventListener('DOMContentLoaded', addReportStyles);

// Export functions for use in other modules
window.generateReport = generateReport; 