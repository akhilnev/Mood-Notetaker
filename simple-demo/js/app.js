/**
 * Main application script for Mood Notetaker Demo
 */

// Main app state
let isRunning = false;
let emotionDetector = null;
let audioProcessor = null;
let recentTranscripts = [];
const MAX_TRANSCRIPTS = 5; // Max number of transcripts to show

// DOM elements
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('overlay');
const startButton = document.getElementById('startBtn');
const stopButton = document.getElementById('stopBtn');
const moodEmoji = document.getElementById('mood-emoji');
const moodText = document.getElementById('mood-text');
const transcriptElement = document.getElementById('transcript');
const summaryElement = document.getElementById('summary');
const statusElement = document.getElementById('status');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the application
 */
async function init() {
  console.log('Initializing Mood Notetaker Demo');
  
  // Set up event listeners
  startButton.addEventListener('click', startSession);
  stopButton.addEventListener('click', stopSession);
  
  // Initialize components
  emotionDetector = new EmotionDetector();
  audioProcessor = new AudioProcessor();
  
  updateStatus('Ready to start');
}

/**
 * Start the session
 */
async function startSession() {
  if (isRunning) return;
  
  // Toggle UI
  startButton.disabled = true;
  stopButton.disabled = false;
  updateStatus('Starting session...');
  
  try {
    // Access webcam
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: 'user'
      }
    });
    
    // Set up video stream
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = async () => {
      // Start video playback
      await videoElement.play();
      
      // Initialize emotion detector
      await emotionDetector.initialize(videoElement, canvasElement);
      emotionDetector.start(updateMood);
      
      // Start audio processor
      await audioProcessor.start(
        updateStatus,
        updateTranscript,
        updateSummary
      );
      
      isRunning = true;
      updateStatus('Session active');
    };
  } catch (error) {
    console.error('Failed to start session:', error);
    updateStatus('Error: ' + (error.message || 'Failed to access camera'));
    resetUI();
  }
}

/**
 * Stop the session
 */
function stopSession() {
  if (!isRunning) return;
  
  // Stop components
  if (emotionDetector) {
    emotionDetector.stop();
  }
  
  if (audioProcessor) {
    audioProcessor.stop();
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
  
  isRunning = false;
  resetUI();
  updateStatus('Session ended');
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
  
  // Update content
  moodEmoji.textContent = emoji;
  moodText.textContent = mood;
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
  
  // Update display
  transcriptElement.innerHTML = recentTranscripts.map(t => `<p>${t}</p>`).join('');
  
  // Scroll to bottom
  transcriptElement.scrollTop = transcriptElement.scrollHeight;
}

/**
 * Update the summary display
 */
function updateSummary(text) {
  summaryElement.textContent = text;
}

/**
 * Update status message
 */
function updateStatus(status) {
  statusElement.textContent = status;
  
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