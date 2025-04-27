// Mood Notetaker Background Service Worker
console.log('Mood Notetaker: Background service worker started');

// Track active tabs running the extension
const activeTabs = new Map();

// Configuration (will be expanded later)
const config = {
  emotionDetectionIntervalMs: 2000,
  transcriptionChunkMs: 5000,
  summarizationIntervalMs: 20000
};

// Helper function to check if a tab is active
function isTabActive(tabId) {
  return activeTabs.has(tabId) && activeTabs.get(tabId).active;
}

// Initialize a tab's processing
function initTab(tabId) {
  if (!activeTabs.has(tabId)) {
    activeTabs.set(tabId, {
      active: false,
      transcript: '',
      lastSummarizedAt: 0,
      currentBullets: []
    });
  }
  return activeTabs.get(tabId);
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type || !sender.tab) return;
  
  const tabId = sender.tab.id;
  console.log(`Received message from tab ${tabId}:`, message.type);
  
  switch (message.type) {
    case 'start':
      handleStart(tabId);
      break;
    case 'stop':
      handleStop(tabId);
      break;
    case 'audio_chunk':
      handleAudioChunk(tabId, message.data);
      break;
    case 'video_frame':
      handleVideoFrame(tabId, message.data);
      break;
    default:
      console.log('Unknown message type:', message.type);
      break;
  }
  
  // Use sendResponse if needed (for synchronous responses)
  // or use chrome.tabs.sendMessage for async responses
});

// Handle start request
function handleStart(tabId) {
  const tabData = initTab(tabId);
  tabData.active = true;
  
  console.log(`Starting processing for tab ${tabId}`);
  
  // Send acknowledgment back to content script
  chrome.tabs.sendMessage(tabId, { 
    type: 'status', 
    status: 'started',
    message: 'Mood Notetaker is now active'
  });
  
  // In the future, we'll set up recurring tasks here
}

// Handle stop request
function handleStop(tabId) {
  if (activeTabs.has(tabId)) {
    const tabData = activeTabs.get(tabId);
    tabData.active = false;
    
    console.log(`Stopping processing for tab ${tabId}`);
    
    // Clean up any resources (will be expanded later)
    
    // Send acknowledgment
    chrome.tabs.sendMessage(tabId, { 
      type: 'status', 
      status: 'stopped',
      message: 'Mood Notetaker is now inactive'
    });
  }
}

// Handle incoming audio chunk
async function handleAudioChunk(tabId, audioData) {
  if (!isTabActive(tabId)) return;
  
  const tabData = activeTabs.get(tabId);
  
  console.log(`Processing audio chunk from tab ${tabId}`);
  
  // In the real implementation, we would:
  // 1. Send audio to Whisper API for transcription
  // 2. Add the transcription to the tab's transcript
  // 3. Check if it's time to summarize
  // 4. If yes, send to GPT for summarization
  
  // For now, let's simulate this with dummy data
  setTimeout(() => {
    // Simulate receiving transcript
    const dummyTranscript = "This is a simulated transcript from an audio chunk.";
    tabData.transcript += " " + dummyTranscript;
    
    // Check if it's time to summarize
    const now = Date.now();
    if (now - tabData.lastSummarizedAt >= config.summarizationIntervalMs) {
      tabData.lastSummarizedAt = now;
      
      // Simulate summarization
      const dummyBullets = [
        "First key point from the simulated conversation",
        "Second important point discussed",
        "Action item: follow up on the demo"
      ];
      
      tabData.currentBullets = dummyBullets;
      
      // Send bullets to content script
      chrome.tabs.sendMessage(tabId, {
        type: 'notes_update',
        bullets: dummyBullets
      });
    }
  }, 1000); // Simulate processing delay
}

// Handle incoming video frame
async function handleVideoFrame(tabId, frameData) {
  if (!isTabActive(tabId)) return;
  
  console.log(`Processing video frame from tab ${tabId}`);
  
  // In the real implementation, we would:
  // 1. Process the frame data to detect emotion
  // 2. Send the detected emotion back to content script
  
  // For now, simulate with dummy data
  setTimeout(() => {
    // Simulate detecting different emotions randomly
    const emotions = ['Happy', 'Neutral', 'Surprised', 'Concentrating'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    // Send the emotion to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'mood_update',
      mood: randomEmotion
    });
  }, 500); // Simulate processing delay
}

// Clean up inactive tabs periodically
setInterval(() => {
  for (const [tabId, tabData] of activeTabs.entries()) {
    if (!tabData.active) {
      // Check if tab has been inactive for a while
      if (tabData.lastActiveTime && Date.now() - tabData.lastActiveTime > 10 * 60 * 1000) { // 10 minutes
        activeTabs.delete(tabId);
        console.log(`Removed inactive tab ${tabId} from tracking`);
      }
    }
  }
}, 60 * 1000); // Check every minute

// Listen for tab close events
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs.has(tabId)) {
    activeTabs.delete(tabId);
    console.log(`Tab ${tabId} closed, removed from tracking`);
  }
}); 