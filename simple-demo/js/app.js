/**
 * Main application script for Mood Notetaker
 */
import { startInterviewAgent, stopInterviewAgent } from './interview-agent.js';

// Application state
const appState = {
  mode: 'practice', // 'practice' or 'interview'
  interviewConfig: null
};

// Main session state
let isRunning = false;
let emotionDetector = null;
let audioProcessor = null;
let recentTranscripts = [];
const MAX_TRANSCRIPTS = 5; // Max number of transcripts to show

// Feature components
let exporter = null;
let notesUploader = null;
let nudgeEngine = null;
let textHighlighter = null;

// DOM elements
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('overlay');
const startButton = document.getElementById('startBtn');
const stopButton = document.getElementById('stopBtn');
const exportButton = document.getElementById('exportBtn');
const moodEmoji = document.getElementById('mood-emoji');
const moodText = document.getElementById('mood-text');
const moodDescription = document.querySelector('.mood-description');
const transcriptElement = document.getElementById('transcript');
const summaryElement = document.getElementById('summary');
const statusElement = document.getElementById('status');
const cameraContainer = document.querySelector('.camera-container');
const cameraOverlay = document.querySelector('.camera-overlay-text');
const cameraStatus = document.querySelector('.camera-status');
const notesContainer = document.getElementById('notes-container');

// Mode toggle elements
const practiceModeBtn = document.getElementById('practiceModeBtn');
const interviewModeBtn = document.getElementById('interviewModeBtn');

// Modal elements
const interviewModal = document.getElementById('interviewModal');
const closeModalBtn = document.querySelector('.close-modal');
const startInterviewBtn = document.getElementById('startInterviewBtn');

// Mood descriptions
const moodDescriptions = {
  'happy': 'Positive emotions detected in facial expressions.',
  'sad': 'Indicators of sadness observed in expressions.',
  'angry': 'Signs of frustration detected in facial features.',
  'surprised': 'Expressions indicate surprise or astonishment.',
  'fearful': 'Facial indicators suggest concern or unease.',
  'disgusted': 'Expressions suggest discomfort or displeasure.',
  'neutral': 'No strong emotional indicators currently detected.'
};

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the application
 */
async function init() {
  console.log('Initializing Mood Notetaker');
  
  // Set up core event listeners
  startButton.addEventListener('click', startSession);
  stopButton.addEventListener('click', stopSession);
  exportButton.addEventListener('click', exportSession);
  
  // Set up mode toggle event listeners
  practiceModeBtn.addEventListener('click', () => setAppMode('practice'));
  interviewModeBtn.addEventListener('click', () => setAppMode('interview'));
  
  // Set up modal event listeners
  closeModalBtn.addEventListener('click', hideModal);
  startInterviewBtn.addEventListener('click', startInterview);
  
  // Close modal if clicked outside
  window.addEventListener('click', (event) => {
    if (event.target === interviewModal) {
      hideModal();
    }
  });
  
  // Initialize core components
  emotionDetector = new EmotionDetector();
  audioProcessor = new AudioProcessor();
  
  // Initialize feature components
  exporter = new Exporter();
  notesUploader = new NotesUploader('#notes-container');
  nudgeEngine = new NudgeEngine();
  textHighlighter = new TextHighlighter();
  
  // Initialize interview feature components (lazy load)
  if (typeof initInterviewComponents === 'function') {
    initInterviewComponents();
  }
  
  // Ensure the notes uploader UI is visible
  if (notesContainer) {
    notesUploader.createUploaderUI();
  }
  
  // Set canvas dimensions
  updateCanvasDimensions();
  
  // Update canvas dimensions on window resize
  window.addEventListener('resize', updateCanvasDimensions);
  
  // Ensure body has the inactive class by default
  document.body.classList.remove('session-active');
  
  // Initialize in practice mode
  setAppMode('practice');
  
  updateStatus('Ready to start');
}

/**
 * Set the application mode
 */
function setAppMode(mode) {
  // Update app state
  appState.mode = mode;
  
  // Update UI
  if (mode === 'practice') {
    practiceModeBtn.classList.add('active');
    interviewModeBtn.classList.remove('active');
    hideModal();
    initPractice();
  } else if (mode === 'interview') {
    practiceModeBtn.classList.remove('active');
    interviewModeBtn.classList.add('active');
    showModal();
    initInterview();
  }
  
  console.log(`App mode set to: ${mode}`);
}

/**
 * Show the interview modal
 */
function showModal() {
  interviewModal.classList.add('show');
}

/**
 * Hide the interview modal
 */
function hideModal() {
  interviewModal.classList.remove('show');
}

/**
 * Initialize practice mode
 */
function initPractice() {
  // Show standard elements, hide interview-specific elements
  console.log('Initializing practice mode');
  // No specific initialization needed yet, just using the default UI
}

/**
 * Initialize interview mode
 */
function initInterview() {
  // Show interview-specific elements, prepare for interview session
  console.log('Initializing interview mode');
  // Actual initialization happens when the interview starts
}

/**
 * Start an interview session based on form input
 */
function startInterview() {
  console.log('Starting interview process');
  
  if (typeof gatherInterviewConfig !== 'function') {
    console.error('Interview setup module not loaded');
    return;
  }
  
  try {
    // Gather configuration from the form
    appState.interviewConfig = gatherInterviewConfig();
    
    console.log('Interview configuration:', appState.interviewConfig);
    
    // Hide the modal
    hideModal();
    
    // Add a clear visual indication that we're in interview mode
    document.body.classList.add('interview-mode');
    
    // Start the session
    startSession();
    
    // Update UI to show interview is starting
    updateTranscript('[System]: Interview session starting. Please wait while we connect to the interviewer...');
    updateStatus('Connecting to interview agent...');
  } catch (error) {
    console.error('Error starting interview:', error);
    updateStatus('Error starting interview: ' + error.message);
  }
}

/**
 * Update canvas dimensions to match window size
 */
function updateCanvasDimensions() {
  const width = cameraContainer.clientWidth;
  const height = cameraContainer.clientHeight;
  
  canvasElement.width = width;
  canvasElement.height = height;
}

/**
 * Start the session
 */
async function startSession() {
  if (isRunning) return;
  
  // Toggle UI
  startButton.disabled = true;
  stopButton.disabled = false;
  exportButton.disabled = true;
  updateStatus('Starting session...');
  
  try {
    // Reset feature components
    exporter.startSession();
    textHighlighter.reset();
    nudgeEngine.reset();
    
    // Hide camera overlay with animation
    cameraStatus.textContent = 'Activating camera...';
    
    // Access webcam with higher resolution
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user'
      }
    });
    
    // Set up video stream
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = async () => {
      // Start video playback
      await videoElement.play();
      
      // Add active class for animation
      cameraContainer.classList.add('active');
      
      // Add session-active class to body
      document.body.classList.add('session-active');
      console.log('Session active class added to body:', document.body.classList.contains('session-active'));
      
      // Hide overlay after animation completes
      setTimeout(() => {
        cameraOverlay.classList.add('hidden');
      }, 500);
      
      // Update canvas dimensions
      updateCanvasDimensions();
      
      // Initialize emotion detector
      await emotionDetector.initialize(videoElement, canvasElement);
      emotionDetector.start(updateMood);
      
      // Handle mode-specific initialization
      if (appState.mode === 'practice') {
        // Standard practice mode - just start audio processor
        console.log('Starting audio processor for practice mode');
        try {
          await audioProcessor.start(
            updateStatus,
            updateTranscript,
            updateSummary
          );
        } catch (error) {
          console.error('Failed to start audio processor:', error);
        }
      } else if (appState.mode === 'interview') {
        // Interview mode - start interview agent
        console.log('Starting interview agent...');
        // Start the interview agent
        await startInterviewAgent(
          appState.interviewConfig,
          updateStatus,
          updateTranscript,
          updateSummary
        );
      }
      
      isRunning = true;
      updateStatus('<span class="status-tag status-active">Active</span> Session in progress');
    };
  } catch (error) {
    console.error('Error starting session:', error);
    updateStatus('Error: ' + error.message);
    resetUI();
    startButton.disabled = false;
    stopButton.disabled = true;
    return;
  }
}

/**
 * Stop the session
 */
async function stopSession() {
  if (!isRunning) return;
  
  // Stop components
  if (emotionDetector) {
    emotionDetector.stop();
  }
  
  if (audioProcessor) {
    audioProcessor.stop();
  }
  
  // Stop interview agent if in interview mode
  if (appState.mode === 'interview') {
    console.log('Stopping interview agent...');
    await stopInterviewAgent();
    // Remove interview mode indicator
    document.body.classList.remove('interview-mode');
  }
  
  // Stop camera
  if (videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
  }
  
  // Clear canvas
  const ctx = canvasElement.getContext('2d');
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Show camera overlay
  cameraOverlay.classList.remove('hidden');
  cameraStatus.textContent = 'Camera inactive';
  
  // Remove active class
  cameraContainer.classList.remove('active');
  
  // Remove session-active class from body
  document.body.classList.remove('session-active');
  
  isRunning = false;
  resetUI();
  updateStatus('Session ended');
  
  // Enable export button
  exportButton.disabled = false;
  
  // If in interview mode and we have a report generator, generate final report
  if (appState.mode === 'interview' && typeof generateInterviewReport === 'function') {
    generateInterviewReport();
  }
}

/**
 * Export the session data
 */
function exportSession() {
  if (!exporter) return;
  
  exporter.exportSession();
  updateStatus('Session exported');
}

/**
 * Reset UI state
 */
function resetUI() {
  startButton.disabled = false;
  stopButton.disabled = true;
}

/**
 * Update the mood display
 */
function updateMood(mood) {
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
  
  // Remove any previous mood classes
  const moodClasses = ['mood-happy', 'mood-sad', 'mood-angry', 
                       'mood-surprised', 'mood-fearful', 'mood-disgusted', 
                       'mood-neutral'];
  moodEmoji.classList.remove(...moodClasses);
  
  // Add current mood class
  moodEmoji.classList.add(`mood-${mood.toLowerCase()}`);
  
  // Update content with animation
  animateElement(moodEmoji, () => {
    moodEmoji.textContent = emoji;
  });
  
  animateElement(moodText, () => {
    moodText.textContent = mood;
  });
  
  // Update description
  moodDescription.textContent = moodDescriptions[mood.toLowerCase()] || moodDescriptions.neutral;
  
  // Log emotion in exporter
  if (exporter && isRunning) {
    exporter.logEmotion(mood);
  }
  
  // Track emotion for nudges
  if (nudgeEngine && isRunning) {
    nudgeEngine.trackEmotion(mood);
  }
}

/**
 * Simple animation for element updates
 */
function animateElement(element, updateFn) {
  element.style.transition = 'opacity 0.2s ease';
  element.style.opacity = '0';
  
  setTimeout(() => {
    updateFn();
    element.style.opacity = '1';
  }, 200);
}

/**
 * Update the transcript display
 */
function updateTranscript(text) {
  // Add to recent transcripts
  recentTranscripts.push(text);
  
  // Keep only the most recent transcripts
  if (recentTranscripts.length > MAX_TRANSCRIPTS) {
    recentTranscripts.shift();
  }
  
  // Create HTML with highlights
  let displayText = recentTranscripts.map(t => `<p>${t}</p>`).join('');
  
  // Apply text highlighting
  if (textHighlighter) {
    const highlightedHtml = textHighlighter.highlightNewText(displayText);
    displayText = highlightedHtml || displayText;
  }
  
  // Update display
  transcriptElement.innerHTML = displayText;
  
  // Process transcript paragraphs for highlighting
  if (textHighlighter) {
    textHighlighter.processTranscriptParagraphs(transcriptElement);
  }
  
  // Scroll to bottom
  transcriptElement.scrollTop = transcriptElement.scrollHeight;
  
  // Update exporter
  if (exporter) {
    // Combine all transcripts into a single string for export
    const fullTranscript = recentTranscripts.join('\n\n');
    exporter.updateTranscript(fullTranscript);
  }
}

/**
 * Update the summary display
 */
function updateSummary(text) {
  // Update with animation
  summaryElement.style.transition = 'opacity 0.3s ease';
  summaryElement.style.opacity = '0.5';
  
  setTimeout(() => {
    summaryElement.textContent = text;
    summaryElement.style.opacity = '1';
  }, 300);
  
  // Update exporter
  if (exporter) {
    exporter.updateSummary(text);
  }
}

/**
 * Update status message
 */
function updateStatus(status) {
  if (!statusElement) return;
  
  statusElement.innerHTML = status;
  
  // Add loading animation for certain statuses
  const isLoading = status.includes('Starting') || 
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

// Add fade-in animation for page load
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});

// Expose required functions for testing
window.appState = appState;
window.initPractice = initPractice;
window.initInterview = initInterview; 