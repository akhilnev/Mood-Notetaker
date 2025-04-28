/**
 * Audio Capturer Module
 * Handles audio capture for transcription
 * Modified to properly handle system audio capture errors in Manifest V3
 */

class AudioCapturer {
  constructor() {
    this.isInitialized = false;
    this.isRunning = false;
    this.stream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingInterval = null;
    this.onStatusUpdate = null;
    
    // Configuration
    this.chunkIntervalMs = 5000; // Send audio chunks every 5 seconds
    this.audioMimeType = 'audio/webm'; // Default MIME type
  }
  
  /**
   * Initialize audio capturer
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Find the best supported MIME type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          this.audioMimeType = type;
          console.log(`Audio Capturer: Using MIME type ${type}`);
          break;
        }
      }
      
      this.isInitialized = true;
      console.log('Audio Capturer: Initialized');
      return true;
    } catch (error) {
      console.error('Audio Capturer: Initialization failed', error);
      return false;
    }
  }
  
  /**
   * Start capturing audio
   * @param {Function} statusCallback - function to call with status updates
   */
  async start(statusCallback) {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) return false;
    }
    
    if (this.isRunning) return true;
    
    this.onStatusUpdate = statusCallback;
    this.updateStatus('Requesting microphone access...');
    
    try {
      // FIXED: Removed the attempt to capture system audio since it's not properly supported
      // and was causing a Content Security Policy error.
      // Going straight to microphone-only mode instead.
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.updateStatus('Using microphone only');
      
      // Create and set up MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.audioMimeType });
      
      // Handle data available events
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.sendAudioChunk(event.data);
        }
      };
      
      // Start recording
      this.mediaRecorder.start(this.chunkIntervalMs);
      
      this.isRunning = true;
      console.log('Audio Capturer: Started recording');
      this.updateStatus('Recording audio...');
      
      return true;
    } catch (error) {
      console.error('Audio Capturer: Failed to start', error);
      this.updateStatus('Failed to access microphone');
      return false;
    }
  }
  
  /**
   * Send audio chunk to background script for processing
   * @param {Blob} audioBlob - audio data to send
   */
  async sendAudioChunk(audioBlob) {
    try {
      // Convert blob to base64 to send via message
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        
        // FIXED: Updated message type to match the background.js expectations
        chrome.runtime.sendMessage({
          type: 'AUDIO_DATA',
          data: {
            audio: base64Audio,
            mimeType: this.audioMimeType
          }
        });
        
        this.updateStatus('Sent audio chunk for processing');
      };
    } catch (error) {
      console.error('Audio Capturer: Failed to send audio chunk', error);
    }
  }
  
  /**
   * Update status via callback if available
   * @param {string} status - status message
   */
  updateStatus(status) {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(status);
    }
  }
  
  /**
   * Stop audio capture and release resources
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Stop and release stream tracks
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clear data
    this.audioChunks = [];
    this.mediaRecorder = null;
    
    console.log('Audio Capturer: Stopped');
    this.updateStatus('Audio recording stopped');
  }
}

// Export the class
window.AudioCapturer = AudioCapturer; 