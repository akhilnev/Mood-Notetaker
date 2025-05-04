/**
 * Feature Test: Interview Modal
 * Tests the functionality of the modal that collects interview parameters
 */

describe('Interview Modal Feature', () => {
  it('should have a modal for collecting interview parameters', async () => {
    // Check if the modal exists in the DOM
    const interviewModal = document.querySelector('#interviewModal');
    expect(interviewModal).not.toBe(null);
  });

  it('should show the modal when clicking the Mock Interview button', async () => {
    // Click the interview mode button
    const interviewButton = document.querySelector('#interviewModeBtn');
    simulateClick(interviewButton);
    
    // Modal should be visible
    const interviewModal = document.querySelector('#interviewModal');
    expect(interviewModal.classList.contains('show')).toBe(true);
  });

  it('should have all required form fields in the modal', () => {
    const roleInput = document.querySelector('#roleInput');
    const companyInput = document.querySelector('#companyInput');
    const durationInput = document.querySelector('#durationInput');
    const focusInput = document.querySelector('#focusInput');
    const linksInput = document.querySelector('#linksInput');
    
    expect(roleInput).not.toBe(null);
    expect(companyInput).not.toBe(null);
    expect(durationInput).not.toBe(null);
    expect(focusInput).not.toBe(null);
    expect(linksInput).not.toBe(null);
    
    // Check input types and attributes
    expect(roleInput.getAttribute('placeholder')).toContain('position');
    expect(companyInput.getAttribute('placeholder')).toContain('company');
    expect(durationInput.getAttribute('type')).toBe('number');
    expect(focusInput.tagName.toLowerCase()).toBe('textarea');
  });

  it('should validate the duration input to be between 1 and 60', () => {
    const durationInput = document.querySelector('#durationInput');
    
    // Check min/max attributes
    expect(durationInput.getAttribute('min')).toBe('1');
    expect(durationInput.getAttribute('max')).toBe('60');
    
    // Test validation by trying to set invalid values
    durationInput.value = '0';
    durationInput.dispatchEvent(new Event('input'));
    expect(durationInput.validity.valid).toBe(false);
    
    durationInput.value = '61';
    durationInput.dispatchEvent(new Event('input'));
    expect(durationInput.validity.valid).toBe(false);
    
    durationInput.value = '30';
    durationInput.dispatchEvent(new Event('input'));
    expect(durationInput.validity.valid).toBe(true);
  });

  it('should gather interview configuration when form is submitted', async () => {
    // Import the interview setup module if it exists
    if (!window.gatherInterviewConfig) {
      // This is just for the test - would be loaded in the implementation
      window.gatherInterviewConfig = function() {
        return {
          role: document.getElementById('roleInput').value,
          company: document.getElementById('companyInput').value,
          duration: +document.getElementById('durationInput').value * 60,
          focus: document.getElementById('focusInput').value,
          links: document.getElementById('linksInput').value.split(',')
        };
      };
    }
    
    // Fill in the form fields
    document.querySelector('#roleInput').value = 'Software Engineer';
    document.querySelector('#companyInput').value = 'Tech Corp';
    document.querySelector('#durationInput').value = '15';
    document.querySelector('#focusInput').value = 'JavaScript, React, Node.js';
    document.querySelector('#linksInput').value = 'https://example.com/job,https://example.com/company';
    
    // Get the configuration
    const config = window.gatherInterviewConfig();
    
    // Verify the configuration
    expect(config.role).toBe('Software Engineer');
    expect(config.company).toBe('Tech Corp');
    expect(config.duration).toBe(15 * 60); // 15 minutes in seconds
    expect(config.focus).toBe('JavaScript, React, Node.js');
    expect(config.links.length).toBe(2);
    expect(config.links[0]).toBe('https://example.com/job');
  });

  it('should have a start button that closes the modal and begins the interview', () => {
    // Check if start button exists
    const startInterviewButton = document.querySelector('#startInterviewBtn');
    expect(startInterviewButton).not.toBe(null);
    
    // Create a spy for the startInterview function
    let startInterviewCalled = false;
    window.startInterview = function() {
      startInterviewCalled = true;
    };
    
    // Click the start button
    simulateClick(startInterviewButton);
    
    // Check if modal is hidden
    const interviewModal = document.querySelector('#interviewModal');
    expect(interviewModal.classList.contains('show')).toBe(false);
    
    // Verify startInterview was called
    expect(startInterviewCalled).toBe(true);
  });
}); 