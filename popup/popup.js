// Mood Notetaker Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  
  // Get the current active tab
  async function getCurrentTab() {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }
  
  // Check if we're on a supported meeting site
  function isMeetingSite(url) {
    return url.includes('zoom.us/') || 
           url.includes('meet.google.com/') || 
           url.includes('teams.microsoft.com/');
  }
  
  // Initialize popup state based on meeting site
  async function initPopup() {
    const tab = await getCurrentTab();
    
    if (!tab || !isMeetingSite(tab.url)) {
      // Not on a meeting site
      startBtn.disabled = true;
      stopBtn.disabled = true;
      statusText.textContent = 'Not on a meeting site';
      return;
    }
    
    // Check if extension is already active in this tab
    chrome.tabs.sendMessage(tab.id, { type: 'get_status' }, response => {
      if (chrome.runtime.lastError) {
        // Content script not loaded or not responding yet
        console.log('Error checking status:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.active) {
        // Extension is active
        statusIcon.classList.remove('inactive');
        statusIcon.classList.add('active');
        statusText.textContent = 'Active';
      } else {
        // Extension is not active
        statusIcon.classList.remove('active');
        statusIcon.classList.add('inactive');
        statusText.textContent = 'Not active';
      }
    });
  }
  
  // Start button click handler
  startBtn.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    
    if (!tab) return;
    
    // Send start message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'start_from_popup' }, response => {
      if (chrome.runtime.lastError) {
        console.log('Error starting:', chrome.runtime.lastError);
        return;
      }
      
      // Update UI
      statusIcon.classList.remove('inactive');
      statusIcon.classList.add('active');
      statusText.textContent = 'Active';
      
      // Close popup
      window.close();
    });
  });
  
  // Stop button click handler
  stopBtn.addEventListener('click', async () => {
    const tab = await getCurrentTab();
    
    if (!tab) return;
    
    // Send stop message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'stop_from_popup' }, response => {
      if (chrome.runtime.lastError) {
        console.log('Error stopping:', chrome.runtime.lastError);
        return;
      }
      
      // Update UI
      statusIcon.classList.remove('active');
      statusIcon.classList.add('inactive');
      statusText.textContent = 'Not active';
      
      // Close popup
      window.close();
    });
  });
  
  // Initialize popup when loaded
  initPopup();
}); 