/**
 * Interview Setup Module for Mood Notetaker
 * Handles gathering interview parameters from the modal form
 */

/**
 * Gather interview configuration from the form
 * @returns {Object} Configuration object with role, company, duration, focus, and links
 */
function gatherInterviewConfig() {
  const roleInput = document.getElementById('roleInput');
  const companyInput = document.getElementById('companyInput');
  const durationInput = document.getElementById('durationInput');
  const focusInput = document.getElementById('focusInput');
  const linksInput = document.getElementById('linksInput');
  
  // Validate inputs
  if (!roleInput.value.trim()) {
    roleInput.focus();
    throw new Error('Please enter a role or position');
  }
  
  if (!companyInput.value.trim()) {
    companyInput.focus();
    throw new Error('Please enter a company name');
  }
  
  // Parse duration
  const duration = parseInt(durationInput.value, 10);
  if (isNaN(duration) || duration < 1 || duration > 60) {
    durationInput.focus();
    throw new Error('Duration must be between 1 and 60 minutes');
  }
  
  // Parse links (if any)
  let links = [];
  if (linksInput.value.trim()) {
    links = linksInput.value
      .split(',')
      .map(link => link.trim())
      .filter(link => link.length > 0);
  }
  
  // Return the configuration
  return {
    role: roleInput.value.trim(),
    company: companyInput.value.trim(),
    duration: duration * 60, // Convert to seconds
    focus: focusInput.value.trim(),
    links: links
  };
}

/**
 * Initialize the interview setup
 */
function initInterviewSetup() {
  console.log('Initializing interview setup');
  
  // Add form validation
  const durationInput = document.getElementById('durationInput');
  if (durationInput) {
    durationInput.addEventListener('input', () => {
      const value = parseInt(durationInput.value, 10);
      if (isNaN(value) || value < 1) {
        durationInput.value = 1;
      } else if (value > 60) {
        durationInput.value = 60;
      }
    });
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initInterviewSetup);

// Export functions for use in other modules
window.gatherInterviewConfig = gatherInterviewConfig; 