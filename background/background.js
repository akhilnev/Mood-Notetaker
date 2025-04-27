// Mood Notetaker Background Service Worker
console.log('Mood Notetaker: Background service worker started');

import config from '../config.js';

// Initialize state
let activeTabs = {};

// Helper function to create new tab state
function createTabState() {
  return {
    isProcessing: false,
    transcriptionBuffer: [],
    summarizationTimer: null,
    currentEmotions: {},
    summaries: [],
    capturedChunks: [],
    processingInProgress: false
  };
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message.type);
  
  const tabId = sender.tab?.id;
  if (!tabId) {
    console.error('No tab ID found in sender');
    return;
  }
  
  switch (message.type) {
    case 'START_PROCESSING':
      startProcessing(tabId);
      sendResponse({ status: 'started' });
      break;
      
    case 'STOP_PROCESSING':
      stopProcessing(tabId);
      sendResponse({ status: 'stopped' });
      break;
      
    case 'AUDIO_DATA':
      handleAudioChunk(message.data, tabId);
      break;
      
    case 'EMOTION_UPDATE':
      updateEmotion(message.data, tabId);
      break;
      
    case 'GET_STATE':
      sendResponse({
        isProcessing: activeTabs[tabId]?.isProcessing || false,
        currentEmotions: activeTabs[tabId]?.currentEmotions || {},
        summaries: activeTabs[tabId]?.summaries || []
      });
      break;
  }
  
  return true; // Keep the message channel open for async response
});

// Start processing for a tab
function startProcessing(tabId) {
  console.log('Starting processing for tab', tabId);
  
  if (!activeTabs[tabId]) {
    activeTabs[tabId] = createTabState();
  }
  
  const tabState = activeTabs[tabId];
  
  if (!tabState.isProcessing) {
    tabState.isProcessing = true;
    
    // Schedule summarization
    scheduleSummarization(tabId);
    
    // Notify content script that processing has started
    chrome.tabs.sendMessage(tabId, { type: 'PROCESSING_STARTED' });
  }
}

// Stop processing for a tab
function stopProcessing(tabId) {
  console.log('Stopping processing for tab', tabId);
  
  if (activeTabs[tabId] && activeTabs[tabId].isProcessing) {
    const tabState = activeTabs[tabId];
    
    // Clear summarization timer
    if (tabState.summarizationTimer) {
      clearTimeout(tabState.summarizationTimer);
      tabState.summarizationTimer = null;
    }
    
    // Process any remaining audio in the buffer
    if (tabState.transcriptionBuffer.length > 0) {
      processTranscriptionBuffer(tabId);
    }
    
    tabState.isProcessing = false;
    
    // Notify content script that processing has stopped
    chrome.tabs.sendMessage(tabId, { type: 'PROCESSING_STOPPED' });
  }
}

// Schedule summarization at regular intervals
function scheduleSummarization(tabId) {
  const tabState = activeTabs[tabId];
  
  if (tabState && tabState.isProcessing) {
    // Clear existing timer if any
    if (tabState.summarizationTimer) {
      clearTimeout(tabState.summarizationTimer);
    }
    
    // Set new timer
    tabState.summarizationTimer = setTimeout(() => {
      generateSummary(tabId);
      scheduleSummarization(tabId); // Schedule the next summarization
    }, config.summarizationIntervalMs);
  }
}

// Handle incoming audio chunk
function handleAudioChunk(audioData, tabId) {
  if (!activeTabs[tabId] || !activeTabs[tabId].isProcessing) {
    return;
  }
  
  const tabState = activeTabs[tabId];
  
  // Add the audio chunk to the buffer
  tabState.capturedChunks.push(audioData);
  
  // Check if we have enough data to process
  if (tabState.capturedChunks.length >= 5) { // Process after collecting several chunks
    processAudioChunks(tabId);
  }
}

// Process collected audio chunks
async function processAudioChunks(tabId) {
  const tabState = activeTabs[tabId];
  
  if (!tabState || tabState.capturedChunks.length === 0 || tabState.processingInProgress) {
    return;
  }
  
  // Set processing flag to prevent concurrent processing
  tabState.processingInProgress = true;
  
  try {
    if (!config.openaiApiKey || config.openaiApiKey === 'your-openai-api-key-here') {
      simulateTranscription(tabId);
    } else {
      // Implement actual Whisper API call
      const transcript = await transcribeWithWhisper(tabState.capturedChunks);
      
      if (transcript) {
        tabState.transcriptionBuffer.push({
          text: transcript,
          timestamp: new Date().toISOString(),
          emotions: tabState.currentEmotions
        });
        
        chrome.tabs.sendMessage(tabId, {
          type: 'TRANSCRIPTION_UPDATED',
          data: { 
            text: transcript,
            emotions: tabState.currentEmotions
          }
        });
      }
    }
  } catch (error) {
    console.error("Transcription error:", error);
  } finally {
    tabState.capturedChunks = [];
    tabState.processingInProgress = false;
  }
}

// Update emotion data for a tab
function updateEmotion(emotionData, tabId) {
  if (!activeTabs[tabId]) {
    activeTabs[tabId] = createTabState();
  }
  
  activeTabs[tabId].currentEmotions = emotionData;
  
  // Notify content script about the emotion update
  chrome.tabs.sendMessage(tabId, {
    type: 'EMOTION_UPDATED',
    data: emotionData
  });
}

// Simulate transcription for demo purposes
function simulateTranscription(tabId) {
  const tabState = activeTabs[tabId];
  
  // Demo transcription texts
  const demoTexts = [
    "I think we should focus on improving the user experience.",
    "The deadline for this project is next Friday.",
    "I'm concerned about the performance issues we're seeing.",
    "Let's schedule another meeting to discuss the details.",
    "I agree with that approach, it makes sense to proceed this way.",
    "We need to prioritize fixing the critical bugs before release.",
    "The new design looks much better than the previous version.",
    "I'm not sure if we have enough resources for this task.",
    "The client requested some changes to the homepage layout.",
    "We've made significant progress since our last meeting."
  ];
  
  // Select a random text
  const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
  
  // Add to transcription buffer
  tabState.transcriptionBuffer.push({
    text: randomText,
    timestamp: new Date().toISOString(),
    emotions: tabState.currentEmotions
  });
  
  // Notify content script
  chrome.tabs.sendMessage(tabId, {
    type: 'TRANSCRIPTION_UPDATED',
    data: {
      text: randomText,
      emotions: tabState.currentEmotions
    }
  });
}

// Process the transcription buffer
function processTranscriptionBuffer(tabId) {
  const tabState = activeTabs[tabId];
  
  if (!tabState || tabState.transcriptionBuffer.length === 0) {
    return;
  }
  
  // In a real implementation, we might store this in chrome.storage
  // or send to a server for persistence
  console.log('Processing transcription buffer for tab', tabId);
}

// Generate summary from transcriptions
async function generateSummary(tabId) {
  const tabState = activeTabs[tabId];
  
  if (!tabState || tabState.transcriptionBuffer.length === 0) {
    return;
  }
  
  const transcriptionTexts = tabState.transcriptionBuffer.map(t => t.text).join(' ');
  
  if (transcriptionTexts.length < 50) return;
  
  try {
    if (!config.openaiApiKey || config.openaiApiKey === 'your-openai-api-key-here') {
      simulateSummary(tabId, transcriptionTexts);
    } else {
      // Implement actual GPT API call
      const summary = await summarizeWithGPT(transcriptionTexts);
      
      if (summary) {
        const timestamp = new Date().toISOString();
        
        tabState.summaries.push({
          text: summary,
          timestamp: timestamp,
          emotions: { ...tabState.currentEmotions }
        });
        
        tabState.transcriptionBuffer = [];
        
        chrome.tabs.sendMessage(tabId, {
          type: 'SUMMARY_UPDATED',
          data: {
            text: summary,
            timestamp: timestamp,
            emotions: { ...tabState.currentEmotions }
          }
        });
      }
    }
  } catch (error) {
    console.error("Summarization error:", error);
  }
}

// Simulate summary generation for demo purposes
function simulateSummary(tabId, transcriptionText) {
  const tabState = activeTabs[tabId];
  
  // Demo summaries
  const demoSummaries = [
    "The team discussed UI improvements and set a deadline for next Friday.",
    "There are concerns about performance issues that need to be addressed.",
    "Progress was made on the project, but resource constraints were mentioned.",
    "The team agreed on a new approach and prioritized fixing critical bugs.",
    "Client requested homepage changes, and the team reviewed the new design."
  ];
  
  // Select a random summary
  const randomSummary = demoSummaries[Math.floor(Math.random() * demoSummaries.length)];
  
  // Add timestamp
  const timestamp = new Date().toISOString();
  
  // Add to summaries
  tabState.summaries.push({
    text: randomSummary,
    timestamp: timestamp,
    emotions: { ...tabState.currentEmotions }
  });
  
  // Clear transcription buffer after summarization
  tabState.transcriptionBuffer = [];
  
  // Notify content script
  chrome.tabs.sendMessage(tabId, {
    type: 'SUMMARY_UPDATED',
    data: {
      text: randomSummary,
      timestamp: timestamp,
      emotions: { ...tabState.currentEmotions }
    }
  });
}

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs[tabId]) {
    stopProcessing(tabId);
    delete activeTabs[tabId];
  }
}); 