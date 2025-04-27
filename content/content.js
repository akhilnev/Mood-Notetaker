// Mood Notetaker Content Script
console.log('Mood Notetaker: Content script loaded');

// State management
let isActive = false;
let currentMood = 'Neutral';
let currentBullets = [];
let overlayElement = null;

// Create and inject overlay
function createOverlay() {
  // Check if overlay already exists
  if (document.getElementById('mood-notetaker-overlay')) {
    return document.getElementById('mood-notetaker-overlay');
  }

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'mood-notetaker-overlay';
  
  // Create header with controls
  const header = document.createElement('div');
  header.className = 'mn-header';
  header.innerHTML = `
    <div class="mn-title">Mood Notetaker</div>
    <div class="mn-controls">
      <button id="mn-toggle-btn">${isActive ? 'Stop' : 'Start'}</button>
      <button id="mn-close-btn">×</button>
    </div>
  `;
  
  // Create mood display section
  const moodDisplay = document.createElement('div');
  moodDisplay.id = 'mn-mood-display';
  moodDisplay.innerHTML = `<span class="mn-mood-emoji">😐</span> <span class="mn-mood-text">Mood: ${currentMood}</span>`;
  
  // Create notes display section
  const notesDisplay = document.createElement('div');
  notesDisplay.id = 'mn-notes-display';
  notesDisplay.innerHTML = '<div class="mn-notes-placeholder">Waiting for notes...</div>';
  
  // Assemble the overlay
  overlay.appendChild(header);
  overlay.appendChild(moodDisplay);
  overlay.appendChild(notesDisplay);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Make overlay draggable
  makeElementDraggable(overlay);
  
  // Add event listeners
  document.getElementById('mn-toggle-btn').addEventListener('click', toggleActive);
  document.getElementById('mn-close-btn').addEventListener('click', hideOverlay);
  
  overlayElement = overlay;
  return overlay;
}

// Make an element draggable
function makeElementDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  element.querySelector('.mn-header').onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get mouse position
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Add event listeners for mouse movement and release
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Toggle active state
function toggleActive() {
  isActive = !isActive;
  
  const toggleBtn = document.getElementById('mn-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = isActive ? 'Stop' : 'Start';
  }
  
  if (isActive) {
    // Notify background script to start processing
    chrome.runtime.sendMessage({ type: 'start' });
    console.log('Mood Notetaker: Started');
  } else {
    // Notify background script to stop processing
    chrome.runtime.sendMessage({ type: 'stop' });
    console.log('Mood Notetaker: Stopped');
  }
}

// Hide overlay
function hideOverlay() {
  if (overlayElement) {
    overlayElement.style.display = 'none';
    isActive = false;
    chrome.runtime.sendMessage({ type: 'stop' });
  }
}

// Update mood in UI
function updateMoodUI(mood) {
  currentMood = mood;
  
  // Map mood to emoji
  const moodEmojis = {
    'happy': '😊',
    'sad': '😔',
    'angry': '😠',
    'surprised': '😮',
    'fearful': '😨',
    'disgusted': '🤢',
    'neutral': '😐'
  };
  
  const emoji = moodEmojis[mood.toLowerCase()] || '😐';
  
  const moodDisplay = document.getElementById('mn-mood-display');
  if (moodDisplay) {
    moodDisplay.innerHTML = `<span class="mn-mood-emoji">${emoji}</span> <span class="mn-mood-text">Mood: ${mood}</span>`;
  }
}

// Update notes in UI
function updateNotesUI(bullets) {
  currentBullets = bullets;
  
  const notesDisplay = document.getElementById('mn-notes-display');
  if (notesDisplay) {
    if (bullets && bullets.length > 0) {
      notesDisplay.innerHTML = '<ul class="mn-notes-list">' + 
        bullets.map(bullet => `<li>${bullet}</li>`).join('') +
        '</ul>';
    } else {
      notesDisplay.innerHTML = '<div class="mn-notes-placeholder">Waiting for notes...</div>';
    }
  }
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;
  
  console.log('Received message:', message.type);
  
  switch (message.type) {
    case 'mood_update':
      updateMoodUI(message.mood);
      break;
    case 'notes_update':
      updateNotesUI(message.bullets);
      break;
    case 'status':
      // Update status (e.g., "Transcribing...", "Processing...")
      break;
    case 'get_status':
      // Respond with current state for popup
      sendResponse({ active: isActive });
      break;
    case 'start_from_popup':
      // Create overlay if it doesn't exist
      if (!overlayElement) {
        createOverlay();
      } else if (overlayElement.style.display === 'none') {
        overlayElement.style.display = 'block';
      }
      // Start processing
      if (!isActive) {
        toggleActive();
      }
      sendResponse({ success: true });
      break;
    case 'stop_from_popup':
      // Stop processing
      if (isActive) {
        toggleActive();
      }
      sendResponse({ success: true });
      break;
    default:
      break;
  }
  
  // Return true to indicate async response (if needed)
  return true;
});

// Check if we're on a supported meeting page
function isOnMeetingPage() {
  const url = window.location.href;
  return (
    url.includes('zoom.us/') ||
    url.includes('meet.google.com/') ||
    url.includes('teams.microsoft.com/')
  );
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  if (isOnMeetingPage()) {
    console.log('Mood Notetaker: Detected meeting page');
    
    // Wait a bit for meeting UI to load completely
    setTimeout(() => {
      createOverlay();
    }, 3000);
  }
});

// Initialize immediately if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (isOnMeetingPage()) {
    console.log('Mood Notetaker: Detected meeting page (immediate)');
    setTimeout(() => {
      createOverlay();
    }, 3000);
  }
} 