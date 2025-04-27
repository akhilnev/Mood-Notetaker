// Mood Notetaker Content Script
console.log('Mood Notetaker: Content script loaded');

// State management
let isActive = false;
let currentMood = 'Neutral';
let currentBullets = [];
let overlayElement = null;
let emotionDetector = null;
let audioCapturer = null;
let statusElement = null;

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
  
  // Create status indicator
  const status = document.createElement('div');
  status.className = 'mn-status';
  status.id = 'mn-status';
  status.textContent = 'Ready to start';
  
  // Assemble the overlay
  overlay.appendChild(header);
  overlay.appendChild(moodDisplay);
  overlay.appendChild(notesDisplay);
  overlay.appendChild(status);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Make overlay draggable
  makeElementDraggable(overlay);
  
  // Add event listeners
  document.getElementById('mn-toggle-btn').addEventListener('click', toggleActive);
  document.getElementById('mn-close-btn').addEventListener('click', hideOverlay);
  
  overlayElement = overlay;
  statusElement = status;
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

// Initialize the EmotionDetector
function initEmotionDetector() {
  if (!emotionDetector) {
    emotionDetector = new EmotionDetector();
  }
}

// Initialize the AudioCapturer
function initAudioCapturer() {
  if (!audioCapturer) {
    audioCapturer = new AudioCapturer();
  }
}

// Update status indicator
function updateStatus(status) {
  if (statusElement) {
    statusElement.textContent = status;
    
    // Check if this is a loading/processing status
    const isLoading = status.includes('Initializing') || 
                     status.includes('Transcribing') || 
                     status.includes('Recording') || 
                     status.includes('Generating') ||
                     status.includes('Processing');
    
    if (isLoading) {
      statusElement.classList.add('loading');
    } else {
      statusElement.classList.remove('loading');
    }
  }
}

// Toggle active state
async function toggleActive() {
  isActive = !isActive;
  
  const toggleBtn = document.getElementById('mn-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = isActive ? 'Stop' : 'Start';
  }
  
  if (isActive) {
    updateStatus('Initializing...');
    
    // Initialize emotion detector if needed
    initEmotionDetector();
    
    // Start emotion detection
    const emotionSuccess = await emotionDetector.start(updateMoodUI);
    if (!emotionSuccess) {
      console.error('Failed to start emotion detection');
      // Show error in UI
      const moodDisplay = document.getElementById('mn-mood-display');
      if (moodDisplay) {
        moodDisplay.innerHTML += '<div class="mn-error">Failed to access camera</div>';
      }
    }
    
    // Initialize audio capturer if needed
    initAudioCapturer();
    
    // Start audio capture
    const audioSuccess = await audioCapturer.start(updateStatus);
    if (!audioSuccess) {
      console.error('Failed to start audio capture');
      // Show error in UI
      updateStatus('Failed to access microphone');
    }
    
    // Notify background script to start processing
    chrome.runtime.sendMessage({ type: 'start' });
    console.log('Mood Notetaker: Started');
  } else {
    // Stop emotion detection
    if (emotionDetector) {
      emotionDetector.stop();
    }
    
    // Stop audio capture
    if (audioCapturer) {
      audioCapturer.stop();
    }
    
    // Notify background script to stop processing
    chrome.runtime.sendMessage({ type: 'stop' });
    console.log('Mood Notetaker: Stopped');
    updateStatus('Stopped');
  }
}

// Hide overlay
function hideOverlay() {
  if (overlayElement) {
    overlayElement.style.display = 'none';
    
    // Stop processing if active
    if (isActive) {
      isActive = false;
      if (emotionDetector) {
        emotionDetector.stop();
      }
      if (audioCapturer) {
        audioCapturer.stop();
      }
      chrome.runtime.sendMessage({ type: 'stop' });
    }
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
    // Remove any previous emotion classes
    const emotionClasses = ['mn-emotion-happy', 'mn-emotion-sad', 'mn-emotion-angry', 
                            'mn-emotion-surprised', 'mn-emotion-fearful', 'mn-emotion-disgusted', 
                            'mn-emotion-neutral'];
    moodDisplay.classList.remove(...emotionClasses);
    
    // Add current emotion class
    moodDisplay.classList.add(`mn-emotion-${mood.toLowerCase()}`);
    
    // Update content
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
      // Update status message
      if (message.message) {
        updateStatus(message.message);
      }
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
      initEmotionDetector();
      initAudioCapturer();
    }, 3000);
  }
});

// Initialize immediately if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (isOnMeetingPage()) {
    console.log('Mood Notetaker: Detected meeting page (immediate)');
    setTimeout(() => {
      createOverlay();
      initEmotionDetector();
      initAudioCapturer();
    }, 3000);
  }
} 