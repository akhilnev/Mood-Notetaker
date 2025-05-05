/**
 * Report Generator Module for Mood Notetaker
 * Generates interview evaluation reports from transcripts
 */

/**
 * Generate a report for the interview
 * @param {Object} interviewConfig - Interview configuration data
 * @param {string} transcript - The full conversation transcript
 * @returns {Promise<string>} The generated report
 */
async function generateReport(interviewConfig, transcript = null) {
  console.log('Generating interview report...');
  
  // If no transcript provided, try to get it from exporter
  if (!transcript && window.exporter) {
    transcript = window.exporter.transcript;
  }
  
  if (!transcript || transcript.length < 50) {
    console.warn('Insufficient transcript data for report generation');
    return 'Insufficient data to generate interview report.';
  }
  
  // Get interview details from config
  const role = interviewConfig.role || 'unspecified role';
  const company = interviewConfig.company || 'unspecified company';
  const focus = interviewConfig.focus || 'general interview topics';
  
  try {
    // Generate report using OpenAI GPT
    const report = await evaluateWithGPT(transcript, role, company, focus);
    
    // Display the report
    displayReport(report);
    
    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    return `Error generating report: ${error.message}`;
  }
}

/**
 * Evaluate the interview using OpenAI GPT
 * @param {string} transcript - The full conversation transcript
 * @param {string} role - The role the candidate is interviewing for
 * @param {string} company - The company name
 * @param {string} focus - Focus areas of the interview
 * @returns {Promise<string>} The evaluation report
 */
async function evaluateWithGPT(transcript, role, company, focus) {
  if (!config.openaiApiKey) {
    return "OpenAI API key not configured. Please add your API key to config.js to enable interview evaluation.";
  }
  
  console.log('Sending transcript to OpenAI for evaluation...');
  
  const prompt = `
You are an expert hiring manager evaluating a candidate for a ${role} position at ${company}.
Below is a transcript of an interview with the candidate, formatted with [Interviewer] and [Candidate] tags.
Focus your evaluation on these areas: ${focus}

Provide a comprehensive evaluation report with the following sections:
1. Overall Assessment - A summary of the candidate's performance
2. Strengths - Key strengths demonstrated during the interview
3. Areas for Improvement - Areas where the candidate could improve
4. Technical Skills - Assessment of demonstrated technical knowledge
5. Communication Skills - Assessment of communication clarity and effectiveness
6. Cultural Fit - How well the candidate might fit with ${company}'s environment
7. Recommendation - Your hiring recommendation (Highly Recommend, Recommend, Neutral, Not Recommended)

Transcript:
${transcript}

Format your evaluation as Markdown.
`;

  try {
    const response = await fetch(config.openaiEndpoint || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.models.gpt || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert hiring manager providing objective candidate evaluations.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Display the report in the UI
 * @param {string} reportText - The generated report text in Markdown format
 */
function displayReport(reportText) {
  // Get or create the report container
  let reportContainer = document.getElementById('report-container');
  
  if (!reportContainer) {
    reportContainer = document.createElement('div');
    reportContainer.id = 'report-container';
    reportContainer.className = 'report-container';
    
    // Create a header
    const header = document.createElement('h2');
    header.innerHTML = '<i class="fas fa-clipboard-check"></i> Interview Evaluation';
    reportContainer.appendChild(header);
    
    // Create content area
    const content = document.createElement('div');
    content.id = 'report-content';
    reportContainer.appendChild(content);
    
    // Add to page - add it to the info panel
    const infoPanel = document.querySelector('.info-panel');
    if (infoPanel) {
      infoPanel.appendChild(reportContainer);
    } else {
      document.body.appendChild(reportContainer);
    }
  }
  
  // Update the content
  const content = document.getElementById('report-content');
  if (content) {
    // Convert markdown to HTML (simple version)
    const html = convertMarkdownToHTML(reportText);
    content.innerHTML = html;
    
    // Make it visible
    reportContainer.style.display = 'block';
  }
}

/**
 * Simple Markdown to HTML converter
 * @param {string} markdown - Markdown text
 * @returns {string} HTML representation
 */
function convertMarkdownToHTML(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
  html = html.replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  
  // Wrap in paragraph
  html = '<p>' + html + '</p>';
  
  // Fix nested list items
  html = html.replace(/<\/ol><ol>/g, '');
  html = html.replace(/<\/ul><ul>/g, '');
  
  return html;
}

// Make the functions available
window.generateReport = generateReport;
window.evaluateWithGPT = evaluateWithGPT; 