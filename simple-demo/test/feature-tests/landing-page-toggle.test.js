/**
 * Feature Test: Landing Page Toggle
 * Tests the functionality to switch between "Practice Speaking" and "Mock Interview" modes
 */

describe('Landing Page Toggle Feature', () => {
  // Test data
  const appModes = {
    PRACTICE: 'practice',
    INTERVIEW: 'interview'
  };

  it('should have a split-button on the landing page', async () => {
    // Check if the split button exists
    const modeToggleWrapper = document.querySelector('.mode-toggle-wrapper');
    expect(modeToggleWrapper).toBeVisible();
    
    // Check if both mode buttons exist
    const practiceButton = document.querySelector('#practiceModeBtn');
    const interviewButton = document.querySelector('#interviewModeBtn');
    
    expect(practiceButton).toBeVisible();
    expect(interviewButton).toBeVisible();
    
    // Verify button text
    expect(practiceButton.textContent).toContain('Practice Speaking');
    expect(interviewButton.textContent).toContain('Mock Interview');
  });

  it('should initialize in practice mode by default', () => {
    // Check if app.js has properly initialized the app state
    expect(window.appState).toBe(undefined); // App state not defined at the start
    
    // Initialize app if not already initialized
    if (typeof window.init === 'function') {
      window.init();
    }
    
    // Now app state should be defined and in practice mode
    expect(window.appState).not.toBe(undefined);
    expect(window.appState.mode).toBe(appModes.PRACTICE);
  });

  it('should switch to interview mode when interview button is clicked', async () => {
    // Get interview mode button
    const interviewButton = document.querySelector('#interviewModeBtn');
    
    // Click interview mode button
    simulateClick(interviewButton);
    
    // Verify app state changed to interview mode
    expect(window.appState.mode).toBe(appModes.INTERVIEW);
    
    // UI should reflect the change
    expect(interviewButton.classList.contains('active')).toBe(true);
    const practiceButton = document.querySelector('#practiceModeBtn');
    expect(practiceButton.classList.contains('active')).toBe(false);
  });

  it('should switch back to practice mode when practice button is clicked', async () => {
    // Ensure we're in interview mode first
    const interviewButton = document.querySelector('#interviewModeBtn');
    simulateClick(interviewButton);
    expect(window.appState.mode).toBe(appModes.INTERVIEW);
    
    // Now switch back to practice mode
    const practiceButton = document.querySelector('#practiceModeBtn');
    simulateClick(practiceButton);
    
    // Verify app state changed back to practice mode
    expect(window.appState.mode).toBe(appModes.PRACTICE);
    
    // UI should reflect the change
    expect(practiceButton.classList.contains('active')).toBe(true);
    expect(interviewButton.classList.contains('active')).toBe(false);
  });

  it('should call initPractice() when in practice mode', () => {
    // Create a spy on the initPractice function
    const originalInitPractice = window.initPractice;
    let initPracticeCalled = false;
    
    window.initPractice = function() {
      initPracticeCalled = true;
      // Restore original function for cleanup
      window.initPractice = originalInitPractice;
    };
    
    // Get practice mode button and click it
    const practiceButton = document.querySelector('#practiceModeBtn');
    simulateClick(practiceButton);
    
    // Verify initPractice was called
    expect(initPracticeCalled).toBe(true);
  });

  it('should call initInterview() when in interview mode', () => {
    // Create a spy on the initInterview function
    const originalInitInterview = window.initInterview;
    let initInterviewCalled = false;
    
    window.initInterview = function() {
      initInterviewCalled = true;
      // Restore original function for cleanup
      window.initInterview = originalInitInterview;
    };
    
    // Get interview mode button and click it
    const interviewButton = document.querySelector('#interviewModeBtn');
    simulateClick(interviewButton);
    
    // Verify initInterview was called
    expect(initInterviewCalled).toBe(true);
  });
}); 